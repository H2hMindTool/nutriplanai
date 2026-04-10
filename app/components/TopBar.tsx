'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname()

  // Hide TopBar on public/onboarding pages
  if (['/login', '/register', '/', '/onboarding', '/acesso-negado'].includes(pathname)) {
    return null
  }

  return (
    <header className="app-top-bar">
      <div className="top-bar-left">
        <button 
          className="hamburger-btn" 
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="top-bar-center">
        <Link href="/app/home" className="logo top-bar-logo">
          <span className="logo-icon">🥗</span>
          <span className="logo-text">NutriPlan<span>AI</span></span>
        </Link>
      </div>

      <div className="top-bar-right">
        {/* Placeholder for Profile or Notifications if needed later */}
        <div className="w-24"></div>
      </div>
    </header>
  )
}
