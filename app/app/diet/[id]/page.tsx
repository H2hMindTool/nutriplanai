import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DietPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { notFound() }

  const { data: diet, error } = await supabase
    .from('diet_requests')
    .select('dieta_html, dieta_texto, preferencia, created_at, calorias, proteinas, carboidratos, gorduras, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !diet) { notFound() }

  if (diet.status !== 'done') {
    return (
      <div className="page-wrapper diet-page-loader">
        <div className="diet-page-loader-inner">
          <div className="spinner spinner-centered" />
          <p className="diet-page-loader-text">Carregando seu plano...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/app/home" className="logo logo-link">
            <div className="logo-icon logo-icon-sm">🥗</div>
            <span className="logo-text logo-text-sm">NutriPlan<span>AI</span></span>
          </Link>
          <div className="header-nav-sm">
            <Link href="/app/history" className="btn btn-ghost btn-nav-sm">
              📋 Histórico
            </Link>
            <Link href="/app/home" className="btn btn-outline btn-nav-sm-outline">
              ← Novo Plano
            </Link>
          </div>
        </div>
      </header>

      <main className="diet-page-main">
        <div className="container-wide">

          {/* Macros Summary */}
          {diet.calorias && (
            <div className="card macros-card animate-fade-in-up">
              <div className="macros-header">
                <div>
                  <h2 className="macros-title">
                    Seu Plano Alimentar <span>Personalizado</span>
                  </h2>
                  <p className="macros-date">
                    Gerado em {new Date(diet.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="macros-actions">
                  <Link href={`/app/shopping-list/${id}`} className="btn btn-primary btn-nav-sm">
                    🛒 Lista de Compras
                  </Link>
                </div>
              </div>

              <div className="macro-grid">
                <div className="macro-card">
                  <div className="macro-value">{diet.calorias}<span className="macro-unit">kcal</span></div>
                  <div className="macro-label">⚡ Calorias</div>
                </div>
                <div className="macro-card">
                  <div className="macro-value">{diet.proteinas}<span className="macro-unit">g</span></div>
                  <div className="macro-label">💪 Proteínas</div>
                </div>
                <div className="macro-card">
                  <div className="macro-value">{diet.carboidratos}<span className="macro-unit">g</span></div>
                  <div className="macro-label">🌾 Carboidratos</div>
                </div>
                <div className="macro-card">
                  <div className="macro-value">{diet.gorduras}<span className="macro-unit">g</span></div>
                  <div className="macro-label">🥑 Gorduras</div>
                </div>
              </div>
            </div>
          )}

          {/* Preferência */}
          <div className="preferencia-box">
            <span>💬</span>
            <p className="preferencia-text">
              <strong>Suas preferências:</strong> {diet.preferencia}
            </p>
          </div>

          {/* Conteúdo da dieta */}
          <div className="card animate-fade-in-up diet-card-delayed">
            <div
              className="diet-render"
              dangerouslySetInnerHTML={{ 
                __html: (diet.dieta_html || diet.dieta_texto || '').replace(/```html|```/g, '').trim() 
              }}
            />
          </div>

          {/* CTA de novo plano */}
          <div className="diet-cta">
            <p className="diet-cta-text">
              Quer um plano com preferências diferentes?
            </p>
            <Link href="/app/home" className="btn btn-primary btn-lg">
              ⚡ Gerar Novo Plano
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
