import type { Metadata } from 'next'
import Link from 'next/link'
import { Download, FolderOpen, ToggleRight, MousePointerClick, RefreshCcw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Install Inline — Chrome extension setup',
  description: 'Step-by-step guide to installing the Inline Chrome extension from source.',
}

/**
 * Install guide. Inline is not yet listed on the Chrome Web Store, so this
 * page documents the unpacked-extension flow honestly instead of pointing
 * CTAs at a store URL that doesn't exist.
 */

const STEPS = [
  {
    icon: Download,
    title: 'Get the extension build',
    body: 'Download or clone the Inline repository and run `npm install && npm run build` inside the inlineExtension folder. This produces a dist/ directory — the loadable extension.',
  },
  {
    icon: FolderOpen,
    title: 'Open Chrome extensions',
    body: 'Visit chrome://extensions in Chrome (or any Chromium browser such as Edge, Brave, or Arc).',
  },
  {
    icon: ToggleRight,
    title: 'Enable Developer mode',
    body: 'Flip the "Developer mode" toggle in the top-right corner of the extensions page.',
  },
  {
    icon: MousePointerClick,
    title: 'Load the unpacked extension',
    body: 'Click "Load unpacked" and select the inlineExtension/dist folder. The Inline icon appears in your toolbar.',
  },
  {
    icon: RefreshCcw,
    title: 'Sign in once to sync',
    body: 'Open your Inline workspace and sign in. Your session syncs to the extension automatically — captures, AI, and read-aloud start working on any page.',
  },
]

export default function InstallPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Navy header band keeps the celestial identity */}
      <section data-hero className="bg-[#0B1735] pt-36 pb-20 px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8AACDB] mb-3">
          Get Inline
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.12]">
          Install the extension
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base md:text-lg leading-relaxed text-stone-300">
          Inline isn&apos;t on the Chrome Web Store yet. Loading it from source takes
          about two minutes — here&apos;s the exact path.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <ol className="space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-5 rounded-2xl border border-stone-200/80 bg-white p-6">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9DAF0] bg-[#EBF1F7] text-sm font-semibold text-[#4B83C4]">
                  {i + 1}
                </span>
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1C1E26]">
                  <step.icon className="h-4 w-4 text-[#4B83C4]" aria-hidden />
                  {step.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-stone-200/80 bg-[#F7F7F5] p-6">
          <h2 className="text-sm font-semibold text-[#1C1E26]">Running the full stack locally</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
            The extension talks to the Inline web app (port 3000) and the annotation
            backend (port 3030). For local development, start both with{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#1C1E26] border border-stone-200">npm run dev</code>{' '}
            in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#1C1E26] border border-stone-200">web/</code> and{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#1C1E26] border border-stone-200">backend/</code>.
            You can point the extension at a different deployment from its popup under Advanced.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-full bg-[#1C1E26] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]"
          >
            Create your workspace
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-stone-300 px-7 py-3 text-sm font-medium text-stone-800 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B83C4]"
          >
            Back to overview
          </Link>
        </div>
      </section>
    </div>
  )
}
