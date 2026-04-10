import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SupportChatFull from '@/app/components/SupportChatFull'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/app/home" className="logo logo-link">
            <div className="logo-icon logo-icon-sm">🥗</div>
            <span className="logo-text logo-text-sm">NutriPlan<span>AI</span></span>
          </Link>
          <div className="flex items-center gap-16">
            <Link href="/app/home" className="btn btn-ghost btn-sm">
              🏠 Início
            </Link>
            <Link href="/app/history" className="btn btn-ghost btn-sm">
              📋 Planos
            </Link>
          </div>
        </div>
      </header>

      <main className="support-main">
        <div className="container-wide chat-page-container">
          <div className="support-header animate-fade-in-up">
            <h1 className="support-title">
              💬 Centro de <span>Suporte</span>
            </h1>
            <p className="support-desc">
              Tire suas dúvidas sobre alimentação, treinos ou sobre o funcionamento do app com nossa IA.
            </p>
          </div>

          <div className="card chat-full-card animate-fade-in-up stagger-1">
            <SupportChatFull />
          </div>
        </div>
      </main>
    </div>
  )
}
