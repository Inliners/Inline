/** Hosted production origin — Chrome Web Store builds use this by default. */
export const INLINE_PRODUCTION_ORIGIN = 'https://useinline.vercel.app'

/** True for `vite dev` and `vite build --mode development` (extension local builds). */
function isLocalDevBuild(): boolean {
  return import.meta.env.MODE === 'development'
}

/** Next.js app — /api/clip, /api/ai/*, /api/tts, etc. */
export const DEFAULT_WEB_URL = isLocalDevBuild()
  ? 'http://localhost:3000'
  : INLINE_PRODUCTION_ORIGIN

/**
 * Annotation API origin. In production the extension targets the web app, which
 * rewrites `/api/annotations` to the Express backend via ANNOTATION_API_ORIGIN.
 */
export const DEFAULT_BACKEND_URL = isLocalDevBuild()
  ? 'http://localhost:3030'
  : INLINE_PRODUCTION_ORIGIN
