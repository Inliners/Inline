import {
  Highlighter,
  MessageSquareText,
  FileText,
  PenLine,
  Volume2,
  Share2,
  BarChart3,
  Map,
  Library,
  Search,
} from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'

/**
 * Capability bento. All ten capabilities ship in the product today.
 */

const FEATURES = [
  {
    icon: Highlighter,
    title: 'Web annotations',
    body: 'Highlights, sticky notes, drawings, handwriting, and stamps that persist and restore on any page.',
    span: 'lg:col-span-2',
    tint: 'bg-[#FEF3C7]',
  },
  {
    icon: MessageSquareText,
    title: 'Ask AI',
    body: 'Chat over your captures with source-grounded answers.',
    span: '',
    tint: 'bg-[#EBF1F7]',
  },
  {
    icon: FileText,
    title: 'Auto-recaps',
    body: 'A living recap document per page, regenerated as you annotate.',
    span: '',
    tint: 'bg-[#F5EDE3]',
  },
  {
    icon: PenLine,
    title: 'Rewrite',
    body: 'Rewrite, shorten, or summarize any selection in place.',
    span: '',
    tint: 'bg-[#EFEAF5]',
  },
  {
    icon: Volume2,
    title: 'Read aloud',
    body: 'Cloud voices through a secure proxy, with a browser-voice fallback.',
    span: '',
    tint: 'bg-[#EBF1F7]',
  },
  {
    icon: Share2,
    title: 'Knowledge graph',
    body: 'See pages, domains, and notes connect into one map of your research.',
    span: 'lg:col-span-2',
    tint: 'bg-[#E8F0EC]',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    body: 'Capture trends over time, by type and by site.',
    span: '',
    tint: 'bg-[#FEF3C7]',
  },
  {
    icon: Map,
    title: 'Spatial map',
    body: 'Captures with place data, plotted on a real map.',
    span: '',
    tint: 'bg-[#E8F0EC]',
  },
  {
    icon: Library,
    title: 'Library docs',
    body: 'Rich-text documents with folders and a full editor.',
    span: '',
    tint: 'bg-[#F5EDE3]',
  },
  {
    icon: Search,
    title: 'Search',
    body: 'Find any capture by keyword — or by meaning through Ask AI.',
    span: '',
    tint: 'bg-[#EFEAF5]',
  },
]

export default function FeatureBento() {
  return (
    <section className="bg-white py-24 md:py-32 border-y border-stone-200/60">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Capabilities"
          title="One layer, every research habit"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={Math.min(i * 0.04, 0.25)} className={f.span}>
              <div className="h-full rounded-2xl border border-stone-200/80 bg-white p-6 transition-colors hover:border-stone-300">
                <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${f.tint} text-[#1C1E26]`}>
                  <f.icon className="h-4.5 w-4.5" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-[#1C1E26]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
