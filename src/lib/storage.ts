/**
 * Storage abstraction layer for both local development and cloud production.
 *
 * Local (development): Uses file system
 * Cloud (production/Vercel): Uses Vercel Blob Storage
 */

import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import path from 'path'

// Check if we're in Vercel production or if BLOB_READ_WRITE_TOKEN is available
const USE_VERCEL_BLOB = process.env.VERCEL === '1' || !!process.env.BLOB_READ_WRITE_TOKEN

/**
 * Initialize Vercel Blob client (lazy-loaded to avoid import errors in development)
 */
let blobClient: any = null

async function getBlobClient() {
  if (blobClient) return blobClient

  if (USE_VERCEL_BLOB) {
    try {
      // Check for BLOB_READ_WRITE_TOKEN
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN not configured')
        console.error('VERCEL env:', process.env.VERCEL)
        console.error('NODE_ENV:', process.env.NODE_ENV)
        throw new Error(
          'BLOB_READ_WRITE_TOKEN not configured. Please add it in Vercel Environment Variables. Go to Vercel Dashboard > Storage > Blob > Connect to Project.'
        )
      }
      
      const { put, del } = await import('@vercel/blob')
      blobClient = { put, del }
      console.log('Vercel Blob client initialized successfully')
      return blobClient
    } catch (error) {
      console.error('Failed to initialize Vercel Blob:', error)
      throw error
    }
  }

  return null
}

/**
 * Upload a file to storage
 * 
 * Returns: 
 * - In development: relative path like "dokumen/abc123.pdf"
 * - In production: full URL like "https://..."
 */
export async function uploadFile(
  filename: string,
  buffer: Buffer,
  options?: { contentType?: string }
): Promise<string> {
  try {
    if (USE_VERCEL_BLOB) {
      const blobClient = await getBlobClient()
      const blob = await blobClient.put(filename, buffer, {
        access: 'public',
        contentType: options?.contentType || 'application/octet-stream',
      })
      return blob.url // Return full URL
    } else {
      // Local development
      const uploadsDir = path.join(process.cwd(), 'uploads')
      const fullPath = path.join(uploadsDir, filename)
      const dir = path.dirname(fullPath)

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true })

      // Write file
      await fs.writeFile(fullPath, buffer)

      // Return relative path
      return filename
    }
  } catch (error) {
    console.error('Upload failed:', error)
    throw new Error(`Failed to upload file: ${filename}`)
  }
}

/**
 * Download a file from storage
 *
 * Input:
 * - In development: relative path like "dokumen/abc123.pdf"
 * - In production: full URL from Vercel Blob
 */
export async function downloadFile(filePathOrUrl: string): Promise<Buffer> {
  try {
    if (USE_VERCEL_BLOB) {
      // In Vercel Blob, files are accessed via their full URL
      // If it's already a full URL, fetch directly
      if (filePathOrUrl.startsWith('http')) {
        const response = await fetch(filePathOrUrl)
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)
      }
      
      // If it's a relative path, we need to construct the URL
      // This shouldn't normally happen in production, but handle it
      console.warn('Relative path provided in production:', filePathOrUrl)
      throw new Error(`Cannot resolve relative path in production: ${filePathOrUrl}`)
    } else {
      // Local development
      const fullPath = path.join(process.cwd(), 'uploads', filePathOrUrl)
      const buffer = await fs.readFile(fullPath)
      return buffer
    }
  } catch (error) {
    console.error('Download failed:', error)
    throw new Error(`Failed to download file: ${filePathOrUrl}`)
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePathOrUrl: string): Promise<void> {
  try {
    if (USE_VERCEL_BLOB) {
      const blobClient = await getBlobClient()

      // Extract pathname from URL if full URL is provided
      let pathname = filePathOrUrl
      if (filePathOrUrl.startsWith('http')) {
        try {
          pathname = new URL(filePathOrUrl).pathname.replace(/^\//, '')
        } catch {
          pathname = filePathOrUrl
        }
      }

      await blobClient.del(pathname)
    } else {
      // Local development
      const fullPath = path.join(process.cwd(), 'uploads', filePathOrUrl)
      if (fsSync.existsSync(fullPath)) {
        await fs.unlink(fullPath)
      }
    }
  } catch (error) {
    console.error('Delete failed:', error)
    throw new Error(`Failed to delete file: ${filePathOrUrl}`)
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePathOrUrl: string): Promise<boolean> {
  try {
    if (USE_VERCEL_BLOB) {
      // In Vercel Blob, check if URL is accessible via HEAD request
      if (filePathOrUrl.startsWith('http')) {
        const response = await fetch(filePathOrUrl, { method: 'HEAD' })
        return response.ok
      }
      // Relative paths don't exist in production
      return false
    } else {
      // Local development
      const fullPath = path.join(process.cwd(), 'uploads', filePathOrUrl)
      try {
        await fs.access(fullPath)
        return true
      } catch {
        return false
      }
    }
  } catch {
    return false
  }
}

/**
 * Create directory (no-op in cloud storage, works in local)
 */
export async function ensureDir(dirPath: string): Promise<void> {
  if (!USE_VERCEL_BLOB) {
    const fullPath = path.join(process.cwd(), 'uploads', dirPath)
    await fs.mkdir(fullPath, { recursive: true })
  }
}

/**
 * Sync version for uploadFile (for use in synchronous contexts)
 * Returns file path/URL synchronously
 */
export function uploadFileSync(
  filename: string,
  buffer: Buffer
): string {
  if (USE_VERCEL_BLOB) {
    throw new Error(
      'Vercel Blob requires async operation. Use uploadFile() instead.'
    )
  }

  // Local development only
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const fullPath = path.join(uploadsDir, filename)
  const dir = path.dirname(fullPath)

  // Ensure directory exists
  fsSync.mkdirSync(dir, { recursive: true })

  // Write file
  fsSync.writeFileSync(fullPath, buffer)

  // Return relative path
  return filename
}

/**
 * Sync version for fileExists
 */
export function fileExistsSync(filePathOrUrl: string): boolean {
  if (USE_VERCEL_BLOB) {
    throw new Error(
      'Vercel Blob requires async operation. Use fileExists() instead.'
    )
  }

  const fullPath = path.join(process.cwd(), 'uploads', filePathOrUrl)
  return fsSync.existsSync(fullPath)
}

/**
 * Sync version for downloadFile (for use in synchronous contexts)
 */
export function downloadFileSync(filePathOrUrl: string): Buffer {
  if (USE_VERCEL_BLOB) {
    throw new Error(
      'Vercel Blob requires async operation. Use downloadFile() instead.'
    )
  }

  const fullPath = path.join(process.cwd(), 'uploads', filePathOrUrl)
  return fsSync.readFileSync(fullPath)
}

/**
 * Get public URL for a file
 * - In development: returns /api/storage/file?path=...
 * - In production: returns the blob URL directly
 */
export function getPublicUrl(filePathOrUrl: string): string {
  if (USE_VERCEL_BLOB && filePathOrUrl.startsWith('http')) {
    // Already a full URL
    return filePathOrUrl
  }

  if (USE_VERCEL_BLOB) {
    // Shouldn't happen, but fallback
    console.warn('File path provided in production:', filePathOrUrl)
    return filePathOrUrl
  }

  // Local development - return API route to serve file
  return `/api/storage?file=${encodeURIComponent(filePathOrUrl)}`
}
