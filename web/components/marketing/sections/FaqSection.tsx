import { Plus } from 'lucide-react'
import { Reveal } from '@/components/marketing/primitives/Reveal'
import { cn } from '@/lib/utils'

/**
 * #faq — native <details>/<summary> accordion: keyboard accessible, no JS,
 * works with reduced motion by default.
 */

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What can Inline do for me?',
    a: 'Inline lets you save what matters while you read—highlights, notes, drawings, rewrites, and quick summaries—right on the page. Everything lands in one place so you can come back later, search it, and ask questions about what you saved.',
  },
  {
    q: 'Does it work on the pages I read every day?',
    a: 'Yes, on most sites you open in Chrome. A few built-in browser pages don\u2019t support extensions, and you can turn Inline off for any site you prefer not to use it on.',
  },
  {
    q: 'Can I ask questions about what I\u2019ve saved?',
    a: 'Yes. Open chat in your workspace and ask in everyday language—like \u201cWhat did I highlight about bridges?\u201d Inline answers from your saved pages and notes, and points you back to where each answer came from.',
  },
  {
    q: 'What happens to my highlights and notes?',
    a: 'They\u2019re saved to your account and linked to the page they came from. When you revisit that page, your annotations show up again. Only you can access what\u2019s in your workspace.',
  },
  {
    q: 'Can Inline read pages aloud?',
    a: 'Yes. You can have a page or a selection read out loud while you work. It\u2019s handled securely on our side—nothing you need to set up or worry about.',
  },
  {
    q: 'What if something stops working?',
    a: 'Inline tells you plainly when a feature isn\u2019t available—no silent failures. If read-aloud can\u2019t connect, it switches to your computer\u2019s built-in voice and lets you know.',
  },
  {
    q: 'Can I use Inline without the Chrome extension?',
    a: 'Yes. Your workspace stands on its own: browse what you\u2019ve already saved, write and organize documents, and chat with Inline about your material. The extension is how new captures come in while you read on the web.',
  },
]

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 bg-[#FDFBF7] py-16 sm:py-20 md:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal className="text-center">
          <p className="text-sm font-semibold text-[#78716c]">FAQ</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-[#1C1E26] md:text-[2.75rem] md:leading-[1.1]">
            Questions, answered plainly
          </h2>
        </Reveal>

        <Reveal className="mt-10 sm:mt-12" delay={0.08}>
          <div>
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                className={cn(
                  'group transition-colors open:bg-[#FAF5EE]/60',
                  i > 0 && 'border-t border-[#E8DFD4]',
                )}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                  <span className="text-left text-base font-semibold leading-snug text-[#1C1E26] sm:text-[1.05rem]">
                    {f.q}
                  </span>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E8DFD4] bg-[#FAF5EE]/60 text-[#78716c] transition-all group-open:rotate-45 group-open:border-[#d6d3d1] group-open:bg-[#FAF5EE]"
                    aria-hidden
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:pb-6 sm:text-[0.9375rem]">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
