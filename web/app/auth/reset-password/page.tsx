'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sendPasswordReset } from '@/lib/actions/auth'
import SolarSystemArt from '@/components/auth/SolarSystemArt'

export default function ResetPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await sendPasswordReset(email)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#FDFBF7] text-[#1C1E26] selection:bg-stone-200 selection:text-[#1C1E26]">
      
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative z-10 bg-[#FDFBF7]">
        
        {/* Logo */}
        <Link
          href="/"
          className="absolute top-8 left-8 sm:left-16 lg:left-24 flex items-center gap-2"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1C1E26]" aria-hidden>
            <span className="block h-4 w-1 rounded-full bg-white -rotate-12" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-[#1C1E26]">
            inline<span className="text-stone-400 ml-0.5 text-sm align-top">~</span>
          </span>
        </Link>

        <div className="w-full max-w-sm mt-16 md:mt-0">
          {sent ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200/50">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26]">
                Check your inbox
              </h1>
              <p className="text-[15px] text-stone-500 leading-relaxed">
                We&apos;ve sent a password reset link to <strong className="text-[#1C1E26] font-medium">{email}</strong>.
                It may take a minute to arrive.
              </p>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="text-[15px] font-medium text-[#1C1E26] hover:text-stone-700 transition-colors"
                >
                  ← Back to log in
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26] mb-3">
                  Reset Password
                </h1>
                <p className="text-[15px] text-stone-500">
                  Remembered it?{' '}
                  <Link href="/auth/login" className="text-[#1C1E26] font-medium hover:text-stone-700 transition-colors">
                    Log in
                  </Link>
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200/80 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <div className="relative group">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full h-12 px-5 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-full bg-[#1C1E26] text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'Sending link...' : 'Send reset link'}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center text-[13px] text-stone-500 leading-relaxed">
                Your captures stay private to your account,<br />
                protected by row-level security.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: navy "solar system" illustration matching the marketing Hero. */}
      <div className="hidden md:block flex-1 relative">
        <SolarSystemArt tagline="A quick reset, and you're back in orbit." />
      </div>
    </div>
  )
}
