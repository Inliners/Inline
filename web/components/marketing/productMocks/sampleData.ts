import type { ChatSource } from '@/components/shell/SourceCard'

export const DEMO_WORKSPACE_ID = 'ws-1'

export const DEMO_BRIDGE_SOURCES: ChatSource[] = [
  {
    ref: 1,
    sourceType: 'note',
    sourceId: 'demo-note-1',
    pageUrl: 'https://engineering.org/cable-stayed-design',
    pageTitle: 'Cable-stayed bridge design',
    domain: 'engineering.org',
    snippet: 'Towers carry deck loads directly through stay cables rather than anchorages.',
    similarity: 0.92,
  },
  {
    ref: 2,
    sourceType: 'recap',
    sourceId: 'demo-recap-1',
    pageUrl: 'https://engineering.org/cable-stayed-design',
    pageTitle: 'Cable-stayed recap',
    domain: 'engineering.org',
    snippet: 'Auto-recap notes shorter construction time vs suspension designs.',
    similarity: 0.88,
  },
  {
    ref: 3,
    sourceType: 'note',
    sourceId: 'demo-note-2',
    pageUrl: 'https://en.wikipedia.org/wiki/Suspension_bridge',
    pageTitle: 'Suspension bridge',
    domain: 'en.wikipedia.org',
    snippet: 'The deck hangs from main cables anchored at both ends.',
    similarity: 0.81,
  },
]

export const DEMO_CAPTURES = [
  {
    title: 'Cable-stayed bridge design',
    preview: 'Towers carry deck loads directly through stay cables…',
    domain: 'engineering.org',
    time: '2h ago',
    pinned: true,
  },
  {
    title: 'Suspension bridge',
    preview: 'Main cables anchored at both ends; deck hangs below…',
    domain: 'en.wikipedia.org',
    time: '1d ago',
    pinned: false,
  },
  {
    title: 'Bridge load distribution',
    preview: 'Highlighted comparison of cable-stayed vs suspension…',
    domain: 'medium.com',
    time: '3d ago',
    pinned: false,
  },
  {
    title: 'fifa - Google Search',
    preview: 'AI summary: tournament format, host nations, and qualification paths…',
    domain: 'www.google.com',
    time: '13h ago',
    pinned: true,
  },
] as const

export const DEMO_LIBRARY_DOCS = [
  {
    title: 'Google AI Studio',
    preview: 'Build with Gemini models, test prompts, and deploy prototypes…',
    autoRecap: true,
    time: '1d ago',
  },
  {
    title: 'White Screen - Fullscreen',
    preview: 'Blank canvas for presentations and mockups.',
    autoRecap: true,
    time: '2d ago',
  },
  {
    title: 'History - Inline',
    preview: 'Browse captures, highlights, and notes across your workspace.',
    autoRecap: true,
    time: '3d ago',
  },
  {
    title: 'Dashboard - Inline',
    preview: 'Workspace home with captures, library docs, and activity stats.',
    autoRecap: true,
    time: '4d ago',
  },
] as const
