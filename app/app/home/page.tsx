'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import SupportChat from '@/app/components/SupportChat'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [preferencia, setPreferencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [perfil, setPerfil] = useState<{ objetivo: string; nome?: string } | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        const { data } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single()

        const { data: np } = await supabase
          .from('nutritional_profiles')
          .select('objetivo')
          .eq('user_id', user.id)
          .single()

        if (data) setPerfil(prev => ({ ...prev, objetivo: np?.objetivo || '', nome: data.nome }))
        else if (np) setPerfil(prev => ({ ...prev, objetivo: np.objetivo }))
      }
    }
    loadUser()
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!preferencia.trim()) {
      setError('Descreva suas preferências alimentares.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Criar registro pending
      const { data: dietRequest, error: dbError } = await supabase
        .from('diet_requests')
        .insert({
          user_id: user.id,
          preferencia: preferencia.trim(),
          status: 'pending',
        })
        .select('id')
        .single()

      if (dbError) throw dbError

      // Redirecionar para loading (que vai chamar a API)
      router.push(`/app/loading?id=${dietRequest.id}`)
    } catch (err) {
      setError('Erro ao iniciar geração. Tente novamente.')
      console.error(err)
      setLoading(false)
    }
  }

  const objetivoLabels: Record<string, string> = {
    emagrecimento: '🎯 Emagrecimento',
    manutencao: '⚖️ Manutenção',
    ganho_muscular: '💪 Ganho Muscular',
    saude_geral: '❤️ Saúde Geral',
  }

  const sugestoes = [
    'Gosto de carnes e ovos, não como peixe',
    'Prefiro refeições simples e rápidas',
    'Adoro frango e vegetais, não gosto de carne de porco',
    'Gosto de comida temperada, mas sem picante',
    'Prefiro alimentos simples do dia a dia',
  ]

  return (
    <div className="page-wrapper">
      
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon hero-logo-icon btn-novo-plano">🥗</div>
            <span className="logo-text hero-logo-text">NutriPlan<span>AI</span></span>
          </div>
          <div className="flex items-center gap-16">
            {perfil?.objetivo && (
              <span className="badge badge-lime">
                {objetivoLabels[perfil.objetivo] || perfil.objetivo}
              </span>
            )}
            <span className="user-email">{userEmail}</span>
            <Link href="/app/evolution" className="btn btn-ghost btn-sm">
              📈 Evolução
            </Link>
            <Link href="/app/history" className="btn btn-ghost btn-sm">
              📋 Meus Planos
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="home-main">
        <div className="container home-container">
          
          {/* Hero */}
          <div className="home-hero animate-fade-in-up">
            <span className="home-hero-emoji">🥗</span>
            <h1 className="home-hero-title">
              Gere seu plano <span>alimentar</span>
            </h1>
            <p className="home-hero-desc">
              A IA vai criar um plano personalizado com base no seu perfil e preferências. Pronto em segundos!
            </p>
          </div>

          {/* Form */}
          <div className="card animate-fade-in-up delay-100">
            <form onSubmit={handleGenerate} className="onboarding-form-stack">
              
              <div className="form-group">
                <label className="form-label" htmlFor="preferencia">
                  Suas preferências alimentares
                </label>
                <textarea
                  id="preferencia"
                  className="form-input home-textarea"
                  placeholder="Ex: Gosto de carnes, ovos e legumes. Não gosto de peixe nem de comidas muito temperadas..."
                  value={preferencia}
                  onChange={e => { setPreferencia(e.target.value); setError('') }}
                  rows={4}
                />
                <p className="home-hint">
                  Seja específico! Quanto mais detalhes, melhor será o seu plano. ✨
                </p>
              </div>

              {error && (
                <div className="form-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Iniciando...
                  </>
                ) : '⚡ Criar Plano Alimentar'}
              </button>
            </form>
          </div>

          {/* Sugestões */}
          <div className="home-sugestoes-wrap animate-fade-in-up">
            <p className="home-sugestoes-label">
              💡 Clique para usar como exemplo:
            </p>
            <div className="home-sugestoes-list">
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  className="btn btn-outline btn-sugestao"
                  onClick={() => setPreferencia(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      <SupportChat />
    </div>
  )
}
