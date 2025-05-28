import { getSignedUploadUrl } from './storage';

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  bucket?: 'private' | 'public';
}

const defaultOptions: UploadOptions = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  bucket: 'private'
};

export async function uploadFile(
  file: File,
  folder: string,
  accessToken: string,
  options: UploadOptions = {}
): Promise<string> {
  const { maxSizeBytes = 10 * 1024 * 1024, allowedTypes = defaultOptions.allowedTypes, bucket = defaultOptions.bucket } = { ...defaultOptions, ...options };

  // Validate file size
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSizeBytes / 1024 / 1024}MB`);
  }

  // Validate file type
  if (!(allowedTypes && allowedTypes.includes(file.type))) {
    throw new Error('File type not allowed');
  }

  try {
    // Get signed URL and upload file
    const path = await getSignedUploadUrl(file, folder, bucket, accessToken);
    return path;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function validateFileType(file: File, allowedTypes?: string[]): boolean {
  const types: string[] = allowedTypes ?? defaultOptions.allowedTypes ?? [];
  return types.includes(file.type);
}

export function validateFileSize(file: File, maxSizeBytes?: number): boolean {
  const sizeLimit = maxSizeBytes ?? defaultOptions.maxSizeBytes ?? 10 * 1024 * 1024;
  return file.size <= sizeLimit;
}