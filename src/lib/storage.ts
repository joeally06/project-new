import { sanitizeError } from './errors';

// Helper to get the current user's UID securely
function getCurrentUserId(): string {
  // TODO: Implement this using your authentication/session logic
  // For example, from a global auth context or Supabase session
  throw new Error('getCurrentUserId() not implemented. You must provide a secure way to get the user UID.');
}

export async function getSignedUploadUrl(file: File, folder: string, bucket: 'private' | 'public' = 'private') {
  try {
    // Enforce folder structure for private bucket
    if (bucket === 'private') {
      // You must implement getCurrentUserId() to return the current user's UID
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      if (folder !== userId) {
        throw new Error('Invalid folder: must match your user ID');
      }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not defined');
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/secure-upload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          bucket,
          folder
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(sanitizeError(result.error || 'Failed to get upload URL'));
    }

    // Upload file using signed URL
    const uploadResponse = await fetch(result.signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Return the file path
    return result.path;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(sanitizeError(error));
  }
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined');
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}