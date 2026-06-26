# Inline

Inline is a workspace and Chrome extension for capturing, annotating, rewriting, and organizing web context. The current source of truth for the product lives on `feature/inline-website`; `main` is behind this branch.

## What Is In This Repo

- `web/` - Next.js workspace app, marketing site, dashboard, document editor, library, history, analytics, settings, and AI API routes.
- `backend/` - Express API used by the extension for annotation persistence.
- `inlineExtension/` - Chrome extension built with React and Vite. It injects the Inline dock, selection tools, AI panels, notes, drawings, handwriting, stamps, search, layers, sharing, and browser-page overlays.
- `supabase/` - Database migrations for extension persistence, workspace data, and RAG/search support.

## Core Features

- Chrome extension dock with AI, rewrite, search, annotation, drawing, handwriting, screenshot, layers, share, and settings.
- Persistent webpage annotations including highlights, sticky notes, paper notes, drawings, handwriting, stamps, and AI replacements.
- Workspace dashboard for activity, library documents, captures, analytics, settings, and source-backed briefs.
- AI capabilities for page recap, rewrite, insight generation, page risk, RAG indexing, search, and text-to-speech.
- Supabase-backed persistence and workspace synchronization.

## Local Development

Install dependencies in the relevant package folders:

```bash
npm install
cd web && npm install
cd ../backend && npm install
cd ../inlineExtension && npm install
```

Run the web app:

```bash
cd web
npm run dev
```

Run the backend:

```bash
cd backend
npm run dev
```

Build the Chrome extension:

```bash
cd inlineExtension
npm run build
```

Load the unpacked extension from `inlineExtension/dist` in Chrome after building.

## Useful URLs

- Web app: `http://localhost:3000`
- Backend API: `http://localhost:3030`
- Extension build output: `inlineExtension/dist`
- Privacy policy: `http://localhost:3000/privacy`

## Extension Privacy Notes

- The extension has a first-run disclosure before capture or AI actions are available.
- Guest/local captures save to browser storage and use encrypted annotation records.
- Signed-in captures sync to the active workspace over secure non-local transport.
- The Chrome Web Store listing should use `/privacy` as the privacy policy URL and mirror the permission reasons in `inlineExtension/README.md`.

## Validation

Common checks:

```bash
cd web && npm run build
cd inlineExtension && npm run build
cd backend && npm run build
```

The extension build runs TypeScript plus the popup, content script, and background worker Vite builds.
