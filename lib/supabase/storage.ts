// Supabase Storage Helper Functions for Project Files

import { supabase } from "./client"
import { getSupabaseAdmin } from "./admin"

const BUCKET_NAME = "project-files"
const AVATARS_BUCKET = "avatars"

/**
 * Upload an avatar image for a user
 * Uses dedicated "avatars" bucket (run supabase-avatars-bucket.sql to create it)
 * @param file - The image file to upload
 * @param userId - The user's ID
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const validExts = ["jpg", "jpeg", "png", "gif", "webp"]
  const ext = validExts.includes(fileExt) ? fileExt : "jpg"
  const filePath = `${userId}/avatar.${ext}`

  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param projectId - The project ID for organizing files
 * @param folder - Optional subfolder (e.g., "attachments", "tasks")
 * @returns The public URL of the uploaded file
 */
export async function uploadProjectFile(
  file: File,
  projectId: string,
  folder: string = "attachments"
): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${projectId}/${folder}/${fileName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    throw new Error(`File upload failed: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - The path to the file in storage
 */
export async function deleteProjectFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`)
  }
}

/**
 * Get a signed URL for private file access (if needed)
 * @param filePath - The path to the file in storage
 * @param expiresIn - Expiration time in seconds (default 1 hour)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Upload a file to Supabase Storage from a Buffer/ArrayBuffer (server-side only).
 * Uses the service role key so this must only be called from API routes.
 * @param buffer - The raw file data as a Buffer or ArrayBuffer
 * @param projectId - The project ID for organizing files
 * @param fileName - The file name to use (e.g. "site-image-1234567890.jpg")
 * @param contentType - The MIME type (e.g. "image/jpeg")
 * @param folder - Optional subfolder (default "attachments")
 * @returns The public URL and storage path of the uploaded file
 */
export async function uploadProjectFileFromBuffer(
  buffer: Buffer | ArrayBuffer,
  projectId: string,
  fileName: string,
  contentType: string = "image/jpeg",
  folder: string = "attachments"
): Promise<{ url: string; path: string }> {
  const admin = getSupabaseAdmin()
  const filePath = `${projectId}/${folder}/${fileName}`

  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    throw new Error(`File upload failed: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: data.path,
  }
}

/**
 * List all files in a project folder
 * @param projectId - The project ID
 * @param folder - Optional subfolder
 */
export async function listProjectFiles(
  projectId: string,
  folder: string = ""
): Promise<any[]> {
  const path = folder ? `${projectId}/${folder}` : projectId

  const { data, error } = await supabase.storage.from(BUCKET_NAME).list(path)

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data || []
}
