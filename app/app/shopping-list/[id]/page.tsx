import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ShoppingListClient from './shopping-list-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ShoppingItem {
  item: string
  categoria: string
  comprado: boolean
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ShoppingListPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: diet, error } = await supabase
    .from('diet_requests')
    .select('id, lista_compras, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !diet) notFound()

  const lista = (diet.lista_compras as ShoppingItem[]) || []

  return (
    <div className="page-wrapper bg-dark">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href={`/app/diet/${id}`} className="btn btn-ghost">
            ← Voltar ao Plano
          </Link>
          <div className="logo logo-center">
            <span className="logo-text logo-text-sm">Lista de <span>Compras</span></span>
          </div>
          <div className="header-spacer-right"></div>
        </div>
      </header>

      <main className="shopping-list-main">
        <div className="container-narrow">
          <div className="shopping-header animate-fade-in-up">
            <h1 className="shopping-title">🛒 Minhas Compras</h1>
            <p className="shopping-subtitle">
              Selecione o que você já comprou no mercado.
            </p>
          </div>

          {lista.length === 0 ? (
            <div className="card empty-card animate-fade-in-up">
              <p>Nenhuma lista disponível para esta dieta.</p>
              <Link href="/app/home" className="btn btn-primary mt-4">Gerar Novo Plano</Link>
            </div>
          ) : (
            <ShoppingListClient initialList={lista} dietId={id} />
          )}
        </div>
      </main>
    </div>
  )
}
