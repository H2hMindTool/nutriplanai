'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { 
    name: 'Início', 
    path: '/app/home', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ) 
  },
  { 
    name: 'Evolução', 
    path: '/app/evolution', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ) 
  },
  { 
    name: 'Planos', 
    path: '/app/history', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ) 
  },
  { 
    name: 'Suporte', 
    path: '/app/support', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ) 
  }
]

export default function MobileNav() {
  const pathname = usePathname()

  if (['/login', '/register', '/', '/onboarding', '/acesso-negado'].includes(pathname)) return null

  return (
    <nav className="mobile-nav-standard">
      <div className="mobile-nav-inner">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-icon">
                {item.icon}
              </div>
              <span className="nav-label">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
