'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()

  // Don't show on non-app pages if needed, but for now let's show on all /app pages
  if (!pathname.startsWith('/app')) return null

  const navItems = [
    { label: 'Início', href: '/app/home', icon: '🏠' },
    { label: 'Evolução', href: '/app/evolution', icon: '📈' },
    { label: 'Planos', href: '/app/history', icon: '📋' },
    { label: 'Dúvidas', href: '/app/support', icon: '💬' },
  ]

  return (
    <nav className="mobile-nav-container">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
