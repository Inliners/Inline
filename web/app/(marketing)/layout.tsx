import { DM_Sans, Caveat } from 'next/font/google'
import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-handwritten',
})

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${dmSans.variable} ${caveat.variable} ${dmSans.className} bg-white text-[#1C1E26] min-h-screen antialiased`}>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
