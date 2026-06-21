'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SolarSystemArt from '@/components/auth/SolarSystemArt'

export default function RegisterPage() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setDone(true)
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

        <div className="w-full max-w-sm mt-16 md:mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {done ? (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200/50">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26]">
                Check your inbox
              </h1>
              <p className="text-[15px] text-stone-500 leading-relaxed">
                We sent a confirmation link to <strong className="text-[#1C1E26] font-medium">{email}</strong>.
                Click it to activate your account.
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
            <>
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1E26] mb-3">
                  Create account
                </h1>
                <p className="text-[15px] text-stone-500">
                  Already have an account?{' '}
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-12 px-5 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Work email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-5 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                </div>

                <div className="space-y-2 relative pb-2">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Password (min 8 characters)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-12 pl-5 pr-12 rounded-full border border-stone-200/50 bg-white text-[15px] text-[#1C1E26] placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 -mt-1 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-[#1C1E26] text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <div className="mt-8 text-center text-[13px] text-stone-500 leading-relaxed">
                Your captures stay private to your account,<br />
                protected by row-level security.
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: navy "solar system" illustration matching the marketing Hero. */}
      <div className="hidden md:block flex-1 relative">
        <SolarSystemArt tagline="A place for every highlight, note, and idea." />
      </div>
    </div>
  )
}
