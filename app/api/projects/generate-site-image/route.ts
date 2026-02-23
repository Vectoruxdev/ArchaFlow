import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { uploadProjectFileFromBuffer } from "@/lib/supabase/storage"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"
// Gemini image generation can take up to 60 seconds
export const maxDuration = 60

const ENHANCEMENT_PROMPT = `You are an architectural photography enhancer. Take this street-level or aerial photo of a property and enhance it to look like a professional architectural photograph. Increase depth and 3D realism, improve lighting and sharpness, enhance colors and contrast, and make it look like a high-end real estate or architectural photo. Keep the same perspective and property structure. Output only the enhanced image.`

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
 * Fallback: fetch a Google Maps Static API satellite/aerial image of the address.
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
 * Send the source image to Gemini 2.0 Flash for enhancement.
 * Returns the enhanced image as a Buffer, or null on failure.
 */
async function enhanceImageWithGemini(imageBuffer: Buffer, geminiApiKey: string): Promise<Buffer | null> {
  const genAI = new GoogleGenerativeAI(geminiApiKey)

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      // @ts-expect-error - responseModalities is supported in gemini-2.0-flash-exp but not yet typed
      responseModalities: ["TEXT", "IMAGE"],
    },
  })

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg" as const,
      data: imageBuffer.toString("base64"),
    },
  }

  const result = await model.generateContent([ENHANCEMENT_PROMPT, imagePart])
  const response = result.response

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const enhancedBuffer = Buffer.from(part.inlineData.data, "base64")
      return enhancedBuffer
    }
  }

  return null
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
    const { projectId, address } = body

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

    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!googleMapsApiKey) {
      return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
    }
    if (!geminiApiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Step 1: Get a property image (Street View first, then satellite fallback)
    const streetViewResult = await fetchStreetViewImage(address, googleMapsApiKey)
    let sourceImageBuffer = streetViewResult.buffer
    let imageSource = "street_view"

    let staticMapResult: { buffer: Buffer | null; error?: string } | null = null
    if (!sourceImageBuffer) {
      staticMapResult = await fetchStaticMapImage(address, googleMapsApiKey)
      sourceImageBuffer = staticMapResult.buffer
      imageSource = "satellite"
    }

    if (!sourceImageBuffer) {
      const errors = [streetViewResult.error, staticMapResult?.error].filter(Boolean).join("; ")
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

    // Step 2: Enhance the image with Gemini
    const enhancedBuffer = await enhanceImageWithGemini(sourceImageBuffer, geminiApiKey)

    // If Gemini image generation fails (model limitation), use the original source image
    const finalBuffer = enhancedBuffer ?? sourceImageBuffer
    const wasEnhanced = !!enhancedBuffer

    // Step 3: Upload enhanced image to Supabase Storage
    const timestamp = Date.now()
    const fileName = `site-image-${timestamp}.jpg`

    const { url, path } = await uploadProjectFileFromBuffer(
      finalBuffer,
      projectId,
      fileName,
      "image/jpeg",
      "attachments"
    )

    // Step 4: Insert a record into project_files
    const fileSizeKb = Math.round(finalBuffer.byteLength / 1024)
    const fileSizeLabel = fileSizeKb >= 1024
      ? `${(fileSizeKb / 1024).toFixed(1)} MB`
      : `${fileSizeKb} KB`

    const { data: fileRecord, error: insertError } = await admin
      .from("project_files")
      .insert({
        project_id: projectId,
        name: wasEnhanced ? `Site Image (AI Enhanced)` : `Site Image (${imageSource === "street_view" ? "Street View" : "Satellite"})`,
        size: fileSizeLabel,
        type: "image/jpeg",
        url,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to save file record: ${insertError.message}`)
    }

    return NextResponse.json({
      success: true,
      fileId: fileRecord.id,
      url,
      path,
      wasEnhanced,
      imageSource,
    })
  } catch (error: any) {
    console.error("[generate-site-image] Error:", error)
    return NextResponse.json(
      { error: error?.message ?? "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
