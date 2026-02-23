import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { uploadProjectFileFromBuffer } from "@/lib/supabase/storage"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { checkAICredits, deductAICredits, CREDIT_COST_PER_ENHANCEMENT } from "@/lib/billing/ai-credits"

export const dynamic = "force-dynamic"
// Two Gemini calls + two Google Maps fetches can take a while
export const maxDuration = 120

const STREET_VIEW_ENHANCEMENT_PROMPT = `You are an architectural photography enhancer. Take this street-level photo of a property and enhance it to look like a professional architectural photograph. Increase depth and 3D realism, improve lighting and sharpness, enhance colors and contrast, and make it look like a high-end real estate or architectural photo. Keep the same perspective and property structure. Output only the enhanced image.`

const AERIAL_ENHANCEMENT_PROMPT = `You are an architectural photography enhancer. Take this aerial/satellite photo of a property and enhance it to look like a professional aerial architectural photograph. Improve clarity and sharpness, enhance colors and contrast, make building structures and landscaping pop with vivid detail, and maintain the bird's-eye perspective. Output only the enhanced image.`

/**
 * Fetch a Google Street View image for the given address.
 * Returns the image as a Buffer, or null if no Street View coverage exists.
 */
async function fetchStreetViewImage(address: string, apiKey: string): Promise<{ buffer: Buffer | null; error?: string }> {
  // First, check metadata to see if Street View coverage exists
  const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(address)}&key=${apiKey}`
  const metaRes = await fetch(metaUrl)
  const meta = await metaRes.json()

  if (meta.status !== "OK") {
    console.log("[generate-site-image] Street View metadata status:", meta.status, meta.error_message || "")
    return { buffer: null, error: `Street View: ${meta.status}${meta.error_message ? ` - ${meta.error_message}` : ""}` }
  }

  const imgUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${encodeURIComponent(address)}&fov=90&pitch=10&key=${apiKey}`
  const imgRes = await fetch(imgUrl)

  if (!imgRes.ok) {
    return { buffer: null, error: `Street View image fetch failed: HTTP ${imgRes.status}` }
  }

  const arrayBuffer = await imgRes.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer) }
}

/**
 * Fetch a Google Maps Static API satellite/aerial image of the address.
 */
async function fetchStaticMapImage(address: string, apiKey: string): Promise<{ buffer: Buffer | null; error?: string }> {
  const imgUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=18&size=640x480&maptype=satellite&key=${apiKey}`
  const imgRes = await fetch(imgUrl)

  if (!imgRes.ok) {
    const text = await imgRes.text().catch(() => "")
    console.log("[generate-site-image] Static Map failed:", imgRes.status, text)
    return { buffer: null, error: `Static Map: HTTP ${imgRes.status}${text ? ` - ${text}` : ""}` }
  }

  const arrayBuffer = await imgRes.arrayBuffer()
  return { buffer: Buffer.from(arrayBuffer) }
}

/**
 * Send the source image to Gemini for enhancement.
 * Returns the enhanced image as a Buffer, or null on failure.
 */
async function enhanceImageWithGemini(imageBuffer: Buffer, geminiApiKey: string, prompt: string): Promise<Buffer | null> {
  const genAI = new GoogleGenerativeAI(geminiApiKey)

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image",
    generationConfig: {
      // @ts-expect-error - responseModalities is supported but not yet typed
      responseModalities: ["TEXT", "IMAGE"],
    },
  })

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg" as const,
      data: imageBuffer.toString("base64"),
    },
  }

  const result = await model.generateContent([prompt, imagePart])
  const response = result.response

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const enhancedBuffer = Buffer.from(part.inlineData.data, "base64")
      return enhancedBuffer
    }
  }

  return null
}

type EnhanceMode = "original" | "enhanced" | "both"

interface GeneratedFile {
  fileId: string
  url: string
  path: string
  wasEnhanced: boolean
  imageSource: "street_view" | "satellite"
  name: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("[generate-site-image] GOOGLE_MAPS_API_KEY:", process.env.GOOGLE_MAPS_API_KEY ? "present" : "missing")
    console.log("[generate-site-image] GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "present" : "missing")

    // Auth check
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, address, enhanceMode = "enhanced" } = body as {
      projectId: string
      address: string
      enhanceMode?: EnhanceMode
    }

    if (!projectId || !address) {
      return NextResponse.json({ error: "Missing projectId or address" }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify the user has access to this project
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, title, business_id")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const { data: membership } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_id", project.business_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Credit check for AI-enhanced modes
    if (enhanceMode !== "original") {
      // "enhanced" uses up to 2 enhancements (street view + satellite), "both" same
      const maxEnhancements = 2
      const creditsNeeded = maxEnhancements * CREDIT_COST_PER_ENHANCEMENT
      const creditCheck = await checkAICredits(project.business_id, creditsNeeded)

      if (!creditCheck.allowed) {
        return NextResponse.json(
          {
            error: "Insufficient AI credits",
            code: "INSUFFICIENT_CREDITS",
            creditsUsed: creditCheck.creditsUsed,
            creditsLimit: creditCheck.creditsLimit,
            creditsNeeded: creditCheck.creditsNeeded,
          },
          { status: 402 }
        )
      }
    }

    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!googleMapsApiKey) {
      return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
    }
    if (!geminiApiKey && enhanceMode !== "original") {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Step 1: Fetch both street view and satellite images in parallel
    const [streetViewResult, satelliteResult] = await Promise.all([
      fetchStreetViewImage(address, googleMapsApiKey),
      fetchStaticMapImage(address, googleMapsApiKey),
    ])

    // We need at least one image source
    if (!streetViewResult.buffer && !satelliteResult.buffer) {
      const errors = [streetViewResult.error, satelliteResult.error].filter(Boolean).join("; ")
      const isApiNotEnabled = errors.includes("REQUEST_DENIED") || errors.includes("403")
      const errorMessage = isApiNotEnabled
        ? "Google Maps API returned REQUEST_DENIED. Please enable the Street View Static API and Maps Static API in your Google Cloud Console."
        : `No map imagery found for this address. Details: ${errors || "Unknown error"}`
      console.error("[generate-site-image] Both image sources failed:", errors)
      return NextResponse.json(
        { error: errorMessage },
        { status: 422 }
      )
    }

    const timestamp = Date.now()
    const generatedFiles: GeneratedFile[] = []

    // Helper to upload and record a file
    async function saveFile(
      buffer: Buffer,
      imageSource: "street_view" | "satellite",
      wasEnhanced: boolean
    ): Promise<GeneratedFile> {
      const sourceLabel = imageSource === "street_view" ? "street_view" : "satellite"
      const suffix = wasEnhanced ? "-enhanced" : ""
      const fileName = `site-image-${sourceLabel}${suffix}-${timestamp}.jpg`

      const { url, path } = await uploadProjectFileFromBuffer(
        buffer,
        projectId,
        fileName,
        "image/jpeg",
        "attachments"
      )

      const sourceDisplayName = imageSource === "street_view" ? "Street View" : "Aerial View"
      const displayName = wasEnhanced
        ? `Site Image - ${sourceDisplayName} (AI Enhanced)`
        : `Site Image - ${sourceDisplayName}`

      const { data: fileRecord, error: insertError } = await admin
        .from("project_files")
        .insert({
          project_id: projectId,
          name: displayName,
          size: buffer.byteLength,
          type: "image/jpeg",
          url,
          uploaded_by: user!.id,
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to save file record: ${insertError.message}`)
      }

      return {
        fileId: fileRecord.id,
        url,
        path,
        wasEnhanced,
        imageSource,
        name: displayName,
      }
    }

    // Step 2: Process images based on enhanceMode
    const imageSources: { buffer: Buffer; source: "street_view" | "satellite"; prompt: string }[] = []

    if (streetViewResult.buffer) {
      imageSources.push({
        buffer: streetViewResult.buffer,
        source: "street_view",
        prompt: STREET_VIEW_ENHANCEMENT_PROMPT,
      })
    }
    if (satelliteResult.buffer) {
      imageSources.push({
        buffer: satelliteResult.buffer,
        source: "satellite",
        prompt: AERIAL_ENHANCEMENT_PROMPT,
      })
    }

    if (enhanceMode === "original") {
      // Save raw Google Maps images only, no Gemini enhancement
      for (const img of imageSources) {
        const file = await saveFile(img.buffer, img.source, false)
        generatedFiles.push(file)
      }
    } else if (enhanceMode === "enhanced") {
      // Enhance with Gemini then save only enhanced versions
      for (const img of imageSources) {
        const enhancedBuffer = await enhanceImageWithGemini(img.buffer, geminiApiKey!, img.prompt)
        const finalBuffer = enhancedBuffer ?? img.buffer
        const file = await saveFile(finalBuffer, img.source, !!enhancedBuffer)
        generatedFiles.push(file)
      }
    } else {
      // "both" - save originals AND enhanced versions
      for (const img of imageSources) {
        // Save original first
        const origFile = await saveFile(img.buffer, img.source, false)
        generatedFiles.push(origFile)

        // Then enhance and save
        const enhancedBuffer = await enhanceImageWithGemini(img.buffer, geminiApiKey!, img.prompt)
        if (enhancedBuffer) {
          const enhFile = await saveFile(enhancedBuffer, img.source, true)
          generatedFiles.push(enhFile)
        }
      }
    }

    // Deduct credits for actually enhanced files (non-blocking)
    const enhancedCount = generatedFiles.filter((f) => f.wasEnhanced).length
    if (enhancedCount > 0) {
      deductAICredits({
        businessId: project.business_id,
        userId: user.id,
        credits: enhancedCount * CREDIT_COST_PER_ENHANCEMENT,
        feature: "site_image_generation",
        metadata: { projectId, enhanceMode, enhancedCount },
      }).catch((err) => console.error("[generate-site-image] Failed to deduct credits:", err))
    }

    return NextResponse.json({
      success: true,
      files: generatedFiles,
      // Backwards compatibility: return first file's fields at top level
      fileId: generatedFiles[0]?.fileId,
      url: generatedFiles[0]?.url,
      path: generatedFiles[0]?.path,
      wasEnhanced: generatedFiles[0]?.wasEnhanced ?? false,
      imageSource: generatedFiles[0]?.imageSource ?? "street_view",
    })
  } catch (error: any) {
    console.error("[generate-site-image] Error:", error)
    return NextResponse.json(
      { error: error?.message ?? "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
