// Use a local proxy to avoid CORS issues during development
// This path will be handled by Next.js rewrites or a custom server in production
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
