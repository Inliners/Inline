export interface PromptTemplate {
  id: string
  label: string
  prompt: string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  { id: 'tldr', label: 'TL;DR for exec', prompt: 'Summarize this in 2-3 bullet points suitable for an executive briefing.' },
  { id: 'bug-report', label: 'Bug report', prompt: 'Rewrite this as a structured bug report with: Summary, Steps to Reproduce, Expected Behavior, Actual Behavior.' },
  { id: 'meeting-notes', label: 'Meeting notes', prompt: 'Reformat this as structured meeting notes with: Key Decisions, Action Items, and Follow-ups.' },
  { id: 'eli5', label: 'Explain simply', prompt: 'Explain this in simple terms that a non-technical person could understand.' },
  { id: 'pros-cons', label: 'Pros & Cons', prompt: 'Analyze this and list the pros and cons in a balanced way.' },
  { id: 'action-items', label: 'Action items', prompt: 'Extract all action items and to-dos from this text as a numbered list.' },
]
