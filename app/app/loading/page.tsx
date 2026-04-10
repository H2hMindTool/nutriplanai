'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

const FRASES = [
  'Calculando seu IMC...',
  'Analisando seu perfil nutricional...',
  'Calculando sua taxa metabólica basal...',
  'Definindo suas necessidades calóricas...',
  'Selecionando alimentos low carb ideais...',
  'Criando opções de refeições personalizadas...',
  'Montando o cardápio do Café da Manhã...',
  'Preparando o Almoço perfeito para você...',
  'Elaborando lanches saudáveis...',
  'Finalizando o Jantar...',
  'Calculando macronutrientes...',
  'Organizando a lista de compras...',
  'Revisando o plano com a IA...',
  'Últimos ajustes no seu plano...',
  'Quase pronto! Finalizando...',
]

const EMOJIS_FLUTUANTES = ['🥩', '🥑', '🥦', '🐟', '🥚', '🫐', '🥜', '🌿', '🍋', '🫑', '🧀', '🥕']

function LoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dietId = searchParams.get('id')
  const supabase = createClient()

  const [frase, setFrase] = useState(FRASES[0])
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [error, setError] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const fraseRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const gerandoRef = useRef(false)

  useEffect(() => {
    if (!dietId) { router.push('/app/home'); return }

    // Iniciar geração via API
    async function startGeneration() {
      if (gerandoRef.current) return
      gerandoRef.current = true

      try {
        const response = await fetch('/api/generate-diet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dietId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Erro na geração')
        }
      } catch (err) {
        console.error('Erro ao gerar dieta:', err)
        setError('Erro ao gerar a dieta. Tentando novamente...')
      }
    }

    startGeneration()

    // Trocar frases a cada 3s
    fraseRef.current = setInterval(() => {
      setFrase(prev => {
        const currentIdx = FRASES.indexOf(prev)
        const nextIdx = (currentIdx + 1) % FRASES.length
        return FRASES[nextIdx]
      })
    }, 3000)

    // Contador de tempo
    timerRef.current = setInterval(() => {
      setTempoDecorrido(prev => prev + 1)
    }, 1000)

    // Polling a cada 3s
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('diet_requests')
          .select('status, id')
          .eq('id', dietId)
          .single()

        if (data?.status === 'done') {
          clearAllIntervals()
          router.push(`/app/diet/${dietId}`)
        } else if (data?.status === 'error') {
          clearAllIntervals()
          setError('Ocorreu um erro na geração. Voltando...')
          setTimeout(() => router.push('/app/home'), 3000)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000)

    return () => clearAllIntervals()
  }, [dietId, router, supabase])

  function clearAllIntervals() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (fraseRef.current) clearInterval(fraseRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const mins = Math.floor(tempoDecorrido / 60)
  const secs = tempoDecorrido % 60

  return (
    <div className="page-wrapper page-centered overflow-hidden">

      {/* Emojis flutuantes */}
      <div className="floating-bg">
        {EMOJIS_FLUTUANTES.map((emoji, i) => (
          <span 
            key={i} 
            className={`floating-emoji emoji-${i + 1}`}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="container animate-fade-in text-center relative z-1">

        {/* Logo */}
        <div className="logo-header hero-logo-wrap mb-48">
          <div className="logo-icon hero-logo-icon">🥗</div>
          <span className="logo-text">NutriPlan<span>AI</span></span>
        </div>

        {/* Spinner */}
        <div className="loading-spinner-wrap mb-40">
          <div className="loading-spinner-outer" />
          <span className="loading-spinner-inner">🧬</span>
        </div>

        {/* Título */}
        <h1 className="loading-title">
          A IA está criando<br />
          <span>seu plano alimentar</span>
        </h1>

        {/* Frase dinâmica */}
        <div className="loading-frase-box">
          <p key={frase} className="animate-fade-in loading-frase-text">
            {frase}
          </p>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mb-20">
          <div className="progress-fill" />
        </div>

        {/* Timer */}
        <p className="loading-timer">
          {mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`} — Média: ~30 segundos
        </p>

        {error && (
          <div className="form-error w-full text-center mt-20">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Dica */}
        <div className="loading-tip-box text-center">
          <p className="loading-tip-text">
            💡 <strong className="text-secondary">Você sabia?</strong> Dietas low carb reduzem os níveis de insulina, facilitando a queima de gordura corporal como fonte de energia.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoadingPage() {
  return (
    <Suspense fallback={<div className="page-wrapper page-centered"><div className="spinner" /></div>}>
      <LoadingContent />
    </Suspense>
  )
}
