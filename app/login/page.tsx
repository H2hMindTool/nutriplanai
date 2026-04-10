'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique seus dados.')
        } else {
          setError(authError.message)
        }
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('usuario_ativo, onboarding_done')
          .eq('id', data.user.id)
          .single()

        if (profile && !profile.usuario_ativo) {
          router.push('/acesso-negado')
          return
        }

        if (profile && !profile.onboarding_done) {
          router.push('/onboarding')
          return
        }

        router.push('/app/home')
        router.refresh()
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper page-centered">

      {/* BG glow */}
      <div className="login-bg-glow" />

      <div className="login-container animate-fade-in-up">

        {/* Logo */}
        <div className="login-logo-wrap">
          <Link href="/" className="logo login-logo">
            <div className="logo-icon login-logo-icon">🥗</div>
            <span className="logo-text">NutriPlan<span>AI</span></span>
          </Link>
          <p className="login-subtitle">Acesse sua conta para continuar</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleLogin} className="login-form">

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
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Entrando...
                </>
              ) : 'Entrar na plataforma'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Não tem acesso?{' '}
          <Link href="#" className="login-footer-cta">
            Saiba mais e adquira aqui
          </Link>
        </p>
      </div>
    </div>
  )
}
