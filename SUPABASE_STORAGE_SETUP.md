# Supabase Storage Setup Guide

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/yhxfkizxrqrqrmnphkny
2. Click on **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter the following details:
   - **Name:** `project-files`
   - **Public bucket:** ✅ Check this (for easy access to files)
   - Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up RLS policies for it.

1. In the Storage section, click on your `project-files` bucket
2. Click on **"Policies"** tab
3. Click **"New policy"**

### Policy 1: Allow Public Read Access

- **Policy name:** `Public read access`
- **Allowed operation:** SELECT
- **Target roles:** `public`
- **Policy definition:**
  ```sql
  true
  ```

### Policy 2: Allow Authenticated Users to Upload

- **Policy name:** `Authenticated users can upload`
- **Allowed operation:** INSERT
- **Target roles:** `authenticated`
- **Policy definition:**
  ```sql
  true
  ```

### Policy 3: Allow Authenticated Users to Delete

- **Policy name:** `Authenticated users can delete`
- **Allowed operation:** DELETE
- **Target roles:** `authenticated`
- **Policy definition:**
  ```sql
  true
  ```

## Step 3: Bucket Structure

Files will be organized as follows:

```
project-files/
├── {project-id}/
│   ├── attachments/
│   │   ├── file1.pdf
│   │   └── file2.jpg
│   ├── tasks/
│   │   └── task-attachment.png
│   └── notes/
│       └── note-image.jpg
```

## Step 4: Using Storage in Your App

The storage helper functions are already created in `lib/supabase/storage.ts`.

### Example Usage:

```typescript
import { uploadProjectFile, deleteProjectFile } from "@/lib/supabase/storage"

// Upload a file
const handleFileUpload = async (file: File, projectId: string) => {
  try {
    const { url, path } = await uploadProjectFile(file, projectId, "attachments")
    
    // Save file metadata to database
    await supabase.from("project_files").insert({
      project_id: projectId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: url,
      uploaded_by: userId,
    })
    
    console.log("File uploaded:", url)
  } catch (error) {
    console.error("Upload failed:", error)
  }
}

// Delete a file
const handleFileDelete = async (fileId: string, filePath: string) => {
  try {
    // Delete from storage
    await deleteProjectFile(filePath)
    
    // Delete metadata from database
    await supabase.from("project_files").delete().eq("id", fileId)
    
    console.log("File deleted")
  } catch (error) {
    console.error("Delete failed:", error)
  }
}
```

## Step 5: Testing

1. Make sure your `.env.local` has the correct Supabase credentials
2. Try uploading a file through the workflow or project detail page
3. Check that the file appears in the Storage bucket
4. Verify that the file URL is accessible

## Notes

- File URLs will be in the format: `https://yhxfkizxrqrqrmnphkny.supabase.co/storage/v1/object/public/project-files/{path}`
- For production, you may want to implement more restrictive RLS policies based on business_id
- Consider adding file size limits and type restrictions
- Implement virus scanning for uploaded files (optional)
