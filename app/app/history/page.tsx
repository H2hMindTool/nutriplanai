import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HistoryClient from './history-client'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: diets } = await supabase
    .from('diet_requests')
    .select('id, preferencia, status, calorias, created_at')
    .eq('user_id', user.id)
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="page-wrapper">

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/app/home" className="logo logo-link">
            <div className="logo-icon logo-icon-sm">🥗</div>
            <span className="logo-text logo-text-sm">NutriPlan<span>AI</span></span>
          </Link>
          <div className="flex items-center gap-12">
            <Link href="/app/evolution" className="btn btn-ghost btn-sm">
              📈 Evolução
            </Link>
            <Link href="/app/home" className="btn btn-primary btn-novo-plano">
              + Novo Plano
            </Link>
          </div>
        </div>
      </header>

      <main className="history-main">
        <div className="container-wide">

          <div className="history-header animate-fade-in-up">
            <h1 className="history-title">
              📋 Histórico de <span>Planos</span>
            </h1>
            <p className="history-count">
              {diets?.length || 0} plano(s) gerado(s) até agora
            </p>
          </div>

          <HistoryClient initialDiets={diets || []} />

        </div>
      </main>
    </div>
  )
}
