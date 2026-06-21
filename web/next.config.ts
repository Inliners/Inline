import type { NextConfig } from 'next'
import path from 'path'

// Backend Express server listens on 3030 by default (see backend/.env
// and backend/src/index.ts — `process.env.PORT || 3030`). Override via
// ANNOTATION_API_ORIGIN if you run it elsewhere.
const ANNOTATION_BACKEND =
  process.env.ANNOTATION_API_ORIGIN ?? 'http://127.0.0.1:3030'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  /** Extension posts to localhost:3000/api/annotations — forward to Express. */
  async rewrites() {
    return [
      {
        source: '/api/annotations',
        destination: `${ANNOTATION_BACKEND}/api/annotations`,
      },
    ]
  },
  /** Friendly aliases — old bookmarks / typed URLs to `/dashboard` and
   *  `/settings` (without the `/app/` prefix) bounced 404 because every
   *  real page lives under `/app/*`. These permanent redirects route them
   *  to the canonical location. */
  async redirects() {
    return [
      { source: '/dashboard',       destination: '/app/dashboard', permanent: false },
      { source: '/settings',        destination: '/app/settings',  permanent: false },
      { source: '/map',             destination: '/app/map',       permanent: false },
      { source: '/graph',           destination: '/app/graph',     permanent: false },
      { source: '/history',         destination: '/app/history',   permanent: false },
      { source: '/account',         destination: '/app/account',   permanent: false },
    ]
  },
}

export default nextConfig
