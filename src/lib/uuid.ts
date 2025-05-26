// [SECURITY] Client-side UUID generation is deprecated. Use server-generated UUIDs only.
export function generateUUID(): never {
  throw new Error('Client-side UUID generation is disabled. Use the /functions/generate-uuid Edge Function.');
}