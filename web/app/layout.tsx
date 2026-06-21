import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotificationsProvider } from '@/components/ui/notifications'
import { ThemeScript } from '@/components/shell/ThemeScript'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Inline — Spatial Memory Layer for the Web',
    template: '%s · Inline',
  },
  description:
    'Anchor sticky notes, drawings, and AI insights directly onto any webpage. Your intelligence, always in context.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script reads localStorage before first paint — eliminates flash */}
        <ThemeScript />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
