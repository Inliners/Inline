'use client'

import { useEffect, useState } from 'react'

const IcSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const IcMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

export default function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))

    const onChange = (e: Event) => {
      const val = (e as CustomEvent<'light' | 'dark'>).detail
      setDark(val === 'dark')
    }
    window.addEventListener('inline-theme-changed', onChange)
    return () => window.removeEventListener('inline-theme-changed', onChange)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('inline-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('inline-theme', 'light')
    }
    window.dispatchEvent(new CustomEvent('inline-theme-changed', { detail: next ? 'dark' : 'light' }))
  }

  if (!mounted) return <div className="w-7 h-7" />

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-sidebar-accent ${className ?? ''}`}
    >
      {dark ? <IcSun /> : <IcMoon />}
    </button>
  )
}
