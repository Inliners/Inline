/**
 * Static copy for the workspace product guide — warm, patient, no AI generation.
 */

export const GUIDE_SUGGESTED_CHAT_PROMPT = 'What did I capture this week?'

export const GUIDE_STEPS_COPY = [
  {
    id: 'welcome',
    title: 'Welcome to your workspace',
    body: 'Hi — I\'m Inline. Whenever you\'re ready, I\'ll walk you through where things live. Skip anytime; your workspace isn\'t going anywhere.',
  },
  {
    id: 'home',
    title: 'Home',
    body: 'This is your base camp — a quick read on recent activity, library documents, and pinned captures.',
  },
  {
    id: 'captures',
    title: 'Captures',
    body: 'Everything you save from the web lands here: highlights, sticky notes, clips, and AI summaries from the extension.',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    body: 'See patterns in what you\'re reading — weekly totals, top domains, and an insights view when you want the bigger picture.',
  },
  {
    id: 'settings',
    title: 'Settings',
    body: 'Workspace identity, folders, export, and preferences. You can restart this tour from Settings anytime.',
  },
  {
    id: 'folders',
    title: 'Folders and documents',
    body: 'Your library lives here. Organize long-form notes and auto-generated recaps in folders — just like a research notebook.',
  },
  {
    id: 'auto-recap',
    title: 'Auto-recap documents',
    body: 'When you annotate a page, Inline can compose a source-backed brief. Open a recap to edit, regenerate, or ask questions about your captures.',
  },
  {
    id: 'ask-inline',
    title: 'Ask Inline',
    body: 'Use the chat pill at the bottom to query your captures and documents. Answers cite what you saved — not the open web.',
  },
  {
    id: 'finish',
    title: 'You\'re all set',
    body: 'Home is always here when you need orientation. Capture a page with the extension, then come back and explore at your own pace.',
  },
] as const

export type GuideStepId = (typeof GUIDE_STEPS_COPY)[number]['id']
