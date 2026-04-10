'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { name: 'Início', path: '/app/home', icon: '🏠' },
  { name: 'Evolução', path: '/app/evolution', icon: '📈' },
  { name: 'Meus Planos', path: '/app/history', icon: '📋' },
  { name: 'Lista de Compras', path: '/app/shopping-list', icon: '🛒' },
  { name: 'Suporte NutriPlan', path: '/app/support', icon: '💬' },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo sidebar-logo">
            <span className="logo-icon">🥗</span>
            <span className="logo-text">NutriPlan<span>AI</span></span>
          </div>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-text">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-text">Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  )
}
