'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import SolarSystemArt from '@/components/auth/SolarSystemArt'

export default function UpdatePasswordPage() {
  const router  = useRouter()
  const [pw,      setPw]      = useState('')
  const [confirm, setConfirm] = useState('')
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (pw !== confirm) { setError('Passwords do not match.'); return }
    if (pw.length < 8)  { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    try {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { error: sbErr } = await supabase.auth.updateUser({ password: pw })
        if (sbErr) throw new Error(sbErr.message)
      }
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
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
            inline
          </span>
        </Link>

        <div className="w-full max-w-sm mt-16 md:mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {done ? (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200/50">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26]">
                Password updated
              </h1>
              <p className="text-[15px] text-stone-500 leading-relaxed">
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26] mb-3">
                  Set new password
                </h1>
                <p className="text-[15px] text-stone-500">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200/80 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="New password"
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    className="w-full h-12 pl-5 pr-12 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full h-12 px-5 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-[#1C1E26] text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <div className="mt-8 text-center text-[13px] text-stone-500 leading-relaxed">
                Changed your mind?{' '}
                <Link href="/auth/login" className="text-[#1C1E26] font-medium hover:underline">
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: navy "solar system" illustration matching the marketing Hero. */}
      <div className="hidden md:block flex-1 relative">
        <SolarSystemArt tagline="One fresh password, and you're home." />
      </div>
    </div>
  )
}
