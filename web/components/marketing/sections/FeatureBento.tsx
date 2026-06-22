import {
  Highlighter,
  MessageCircle,
  FileText,
  PenLine,
  Volume2,
  BarChart3,
  Library,
  Search,
} from 'lucide-react'
import { Reveal, SectionHeading } from '@/components/marketing/primitives/Reveal'
import { mktCard } from '@/components/marketing/marketingSurfaces'

/**
 * Capability bento. All ten capabilities ship in the product today.
 */

const FEATURES = [
  {
    icon: Highlighter,
    title: 'Web annotations',
    body: 'Highlights, sticky notes, drawings, handwriting, and stamps that persist and restore on any page.',
    span: 'lg:col-span-2',
    tint: 'bg-[#F4F4F2]',
  },
  {
    icon: MessageCircle,
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
    tint: 'bg-[#F7F7F5]',
  },
  {
    icon: Volume2,
    title: 'Read aloud',
    body: 'Cloud voices through a secure proxy, with a browser-voice fallback.',
    span: '',
    tint: 'bg-[#EBF1F7]',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    body: 'Capture trends over time, by type and by site.',
    span: 'lg:col-span-2',
    tint: 'bg-[#F4F4F2]',
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
    <section className="border-y border-[#F5EDE3] bg-[#FDFBF7] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Capabilities"
          title="One layer, every research habit"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={Math.min(i * 0.04, 0.25)} className={f.span}>
              <div className={`h-full transition-colors hover:border-[#D9CFC2] ${mktCard}`}>
                <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-[#d6d3d1] ${f.tint} text-[#1C1E26]`}>
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
