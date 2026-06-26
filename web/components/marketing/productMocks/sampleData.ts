import type { ChatSource } from '@/components/shell/SourceCard'

/** Placeholder domain for marketing mocks — not a real website. */
export const DEMO_DOMAIN = 'article-source.com'

export const DEMO_PAGE_TITLE = 'Source page title'
export const DEMO_PAGE_TITLE_ALT = 'Related article'
export const DEMO_PAGE_TITLE_RECAP = 'Page recap'

function demoUrl(path: string): string {
  return `https://${DEMO_DOMAIN}/${path}`
}

export const DEMO_WORKSPACE_ID = 'ws-1'

export const DEMO_BRIDGE_SOURCES: ChatSource[] = [
  {
    ref: 1,
    sourceType: 'note',
    sourceId: 'demo-note-1',
    pageUrl: demoUrl('source-page'),
    pageTitle: DEMO_PAGE_TITLE,
    domain: DEMO_DOMAIN,
    snippet: 'Your note on the opening argument and how the author frames the topic.',
    similarity: 0.92,
  },
  {
    ref: 2,
    sourceType: 'recap',
    sourceId: 'demo-recap-1',
    pageUrl: demoUrl('source-page'),
    pageTitle: DEMO_PAGE_TITLE_RECAP,
    domain: DEMO_DOMAIN,
    snippet: 'Auto-recap pulls in your latest highlights and sticky notes.',
    similarity: 0.88,
  },
  {
    ref: 3,
    sourceType: 'note',
    sourceId: 'demo-note-2',
    pageUrl: demoUrl('related-article'),
    pageTitle: DEMO_PAGE_TITLE_ALT,
    domain: DEMO_DOMAIN,
    snippet: 'A second capture with supporting details from another section.',
    similarity: 0.81,
  },
]

export const DEMO_CAPTURES = [
  {
    title: DEMO_PAGE_TITLE,
    preview: 'Opening section summarizes the main argument…',
    domain: DEMO_DOMAIN,
    time: '2h ago',
    pinned: true,
  },
  {
    title: DEMO_PAGE_TITLE_ALT,
    preview: 'Supporting points from a paragraph you highlighted…',
    domain: DEMO_DOMAIN,
    time: '1d ago',
    pinned: false,
  },
  {
    title: 'Follow-up reading',
    preview: 'Notes merged from a second pass through the article…',
    domain: DEMO_DOMAIN,
    time: '3d ago',
    pinned: false,
  },
  {
    title: 'Background context',
    preview: 'Definitions and terms you marked for later…',
    domain: DEMO_DOMAIN,
    time: '5d ago',
    pinned: false,
  },
] as const

export const DEMO_LIBRARY_DOCS = [
  {
    title: DEMO_PAGE_TITLE_RECAP,
    preview: '4 captures from Source page title — overview, highlights, and sticky notes.',
    autoRecap: true,
    folder: 'Auto Recaps',
    time: '2h ago',
  },
  {
    title: DEMO_PAGE_TITLE,
    preview: 'The recap now reflects your highlights on the core claim and a supporting example.',
    autoRecap: true,
    folder: 'Auto Recaps',
    time: '1d ago',
  },
  {
    title: DEMO_PAGE_TITLE_ALT,
    preview: 'Captures summarized with your notes on the main takeaways.',
    autoRecap: true,
    folder: 'Auto Recaps',
    time: '3d ago',
  },
  {
    title: 'Follow-up reading',
    preview: 'Compared two articles you saved during the same session.',
    autoRecap: true,
    folder: 'Auto Recaps',
    time: '5d ago',
  },
] as const

/** Structured recap preview content for marketing mocks. */
export const DEMO_RECAP_OVERVIEW = {
  range: '3/24/2026, 2:15 PM – 3/24/2026, 4:48 PM',
  captureCount: 4,
  summary:
    'The recap reflects your latest highlights on the core claim and a supporting example from later in the article.',
} as const

export const DEMO_RECAP_TAKEAWAYS = [
  'The author states the central point in section two.',
  'Your highlight calls out the example that backs it up.',
  'A sticky note compares this article to one you saved last week.',
] as const

export const DEMO_RECAP_CAPTURE_ENTRIES = [
  {
    time: '3/24/2026, 2:18 PM',
    type: 'highlight',
    quote: 'central point in section two',
  },
  {
    time: '3/24/2026, 3:02 PM',
    type: 'highlight',
    quote: 'supporting example appears midway through the page',
  },
  {
    time: '3/24/2026, 4:12 PM',
    type: 'sticky',
    body: 'Worth comparing with the related article you saved last week.',
  },
] as const

/** Static HTML for marketing recap document preview — mirrors auto-recap editor output. */
export const DEMO_RECAP_DOCUMENT_HTML = `
<h2>Overview <span class="recap-overview-range">3/24/2026, 2:15 PM – 3/24/2026, 4:48 PM</span></h2>
<p>4 captures from <strong>${DEMO_PAGE_TITLE}</strong> (${DEMO_DOMAIN}).</p>
<p>The recap reflects your latest highlights on the core claim and a supporting example from later in the article.</p>
<h3>Key takeaways</h3>
<ul class="recap-bullets">
<li><p>The author states the central point in section two.</p></li>
<li><p>Your highlight calls out the example that backs it up.</p></li>
<li><p>A sticky note compares this article to one you saved last week.</p></li>
</ul>
<div class="recap-entry">
<p><em>3/24/2026, 2:18 PM — highlight</em></p>
<blockquote class="recap-quote"><p>central point in section two</p></blockquote>
</div>
<hr>
<div class="recap-entry">
<p><em>3/24/2026, 3:02 PM — highlight</em></p>
<blockquote class="recap-quote"><p>supporting example appears midway through the page</p></blockquote>
</div>
<hr>
<div class="recap-entry">
<p><em>3/24/2026, 4:12 PM — sticky</em></p>
<p>Worth comparing with the related article you saved last week.</p>
</div>
`.trim()

/** Domains shown in “cited answers” and analytics mocks */
export const DEMO_TOP_DOMAINS = [DEMO_DOMAIN, 'notes-archive.test', 'reading-list.test'] as const
