'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Criar registro no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (data.user) {
        // 2. O Trigger de Banco geralmente cria o profile, mas para o MODO DEMO
        // vamos garantir que ele está ativo imediatamente.
        // Esperamos um pouco para o trigger de banco processar se existir
        await new Promise(r => setTimeout(r, 1000))

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ usuario_ativo: true })
          .eq('id', data.user.id)

        if (profileError) {
          console.error('Erro ao ativar perfil demo:', profileError)
          // Se falhar o update direto, talvez o profile ainda não exista
          // O usuário precisará logar e o sistema de onboarding cuidará do resto
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="page-wrapper page-centered">
        <div className="login-container text-center">
          <div className="hero-logo-wrap mb-8">
            <div className="logo-icon hero-logo-icon">✅</div>
          </div>
          <h1 className="hero-title">Conta Criada!</h1>
          <p className="hero-desc">
            Sua conta de demonstração foi ativada com sucesso. 
            Você será redirecionado para o login em instantes...
          </p>
          <div className="btn-spinner mx-auto mt-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper page-centered">
      <div className="login-bg-glow" />

      <div className="login-container animate-fade-in-up">
        <div className="login-logo-wrap">
          <Link href="/" className="logo login-logo">
            <div className="logo-icon login-logo-icon">🥗</div>
            <span className="logo-text">NutriPlan<span>AI</span></span>
          </Link>
          <h2 className="hero-title demo-title">
            Modo <span>Demonstração</span>
          </h2>
          <p className="login-subtitle">Crie sua conta gratuita agora</p>
        </div>

        <div className="card">
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="form-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full login-btn"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : '🚀 Criar Conta Grátis'}
            </button>
          </form>
        </div>

        <p className="login-footer">
          Já tem uma conta?{' '}
          <Link href="/login" className="login-footer-cta">
            Voltar para o Login
          </Link>
        </p>
      </div>
    </div>
  )
}
