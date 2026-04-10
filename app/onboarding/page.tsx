'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Perfil', 'Objetivo', 'Restrições']

const RESTRICOES_OPTIONS = [
  { value: 'lactose', label: '🥛 Sem Lactose' },
  { value: 'gluten', label: '🌾 Sem Glúten' },
  { value: 'vegetariano', label: '🥕 Vegetariano' },
  { value: 'vegano', label: '🌱 Vegano' },
  { value: 'frutos_mar', label: '🦐 Sem Frutos do Mar' },
  { value: 'amendoim', label: '🥜 Sem Amendoim' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    peso: '',
    altura: '',
    idade: '',
    sexo: '',
    nivel_atividade: '',
    objetivo: '',
    restricoes: [] as string[],
  })

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setError('')
  }

  function toggleRestricao(value: string) {
    setForm(prev => ({
      ...prev,
      restricoes: prev.restricoes.includes(value)
        ? prev.restricoes.filter(r => r !== value)
        : [...prev.restricoes, value],
    }))
  }

  function validateStep() {
    if (step === 0) {
      if (!form.peso || !form.altura || !form.idade || !form.sexo)
        return 'Preencha todos os campos antes de continuar.'
      if (parseFloat(form.peso) < 30 || parseFloat(form.peso) > 300)
        return 'Peso deve estar entre 30 e 300 kg.'
      if (parseInt(form.altura) < 100 || parseInt(form.altura) > 250)
        return 'Altura deve estar entre 100 e 250 cm.'
      if (parseInt(form.idade) < 10 || parseInt(form.idade) > 100)
        return 'Idade deve estar entre 10 e 100 anos.'
    }
    if (step === 1) {
      if (!form.nivel_atividade || !form.objetivo)
        return 'Selecione todas as opções antes de continuar.'
    }
    return ''
  }

  function nextStep() {
    const err = validateStep()
    if (err) { setError(err); return }
    setStep(prev => prev + 1)
    setError('')
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error: npError } = await supabase
        .from('nutritional_profiles')
        .upsert({
          user_id: user.id,
          peso: parseFloat(form.peso),
          altura: parseInt(form.altura),
          idade: parseInt(form.idade),
          sexo: form.sexo,
          nivel_atividade: form.nivel_atividade,
          objetivo: form.objetivo,
          restricoes: form.restricoes,
        })

      if (npError) throw npError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_done: true })
        .eq('id', user.id)

      if (profileError) throw profileError

      router.push('/app/home')
    } catch (err) {
      setError('Erro ao salvar seus dados. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper page-centered">

      <div className="onboarding-container animate-fade-in-up">

        {/* Header */}
        <div className="onboarding-header">
          <div className="logo-header">
            <div className="logo-icon">🥗</div>
            <span className="logo-text">NutriPlan<span>AI</span></span>
          </div>
          <h1 className="onboarding-title">
            Configure seu perfil
          </h1>
          <p className="onboarding-step-info">
            Etapa {step + 1} de {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Step indicators */}
        <div className="steps">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="card">

          {/* STEP 0: Perfil físico */}
          {step === 0 && (
            <div className="onboarding-form-stack">
              <div className="onboarding-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="peso">Peso (kg)</label>
                  <input
                    id="peso"
                    type="number"
                    className="form-input"
                    placeholder="70"
                    value={form.peso}
                    onChange={e => updateForm('peso', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="altura">Altura (cm)</label>
                  <input
                    id="altura"
                    type="number"
                    className="form-input"
                    placeholder="170"
                    value={form.altura}
                    onChange={e => updateForm('altura', e.target.value)}
                  />
                </div>
              </div>

              <div className="onboarding-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="idade">Idade (anos)</label>
                  <input
                    id="idade"
                    type="number"
                    className="form-input"
                    placeholder="30"
                    value={form.idade}
                    onChange={e => updateForm('idade', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="sexo">Sexo biológico</label>
                  <select
                    id="sexo"
                    className="form-select"
                    value={form.sexo}
                    onChange={e => updateForm('sexo', e.target.value)}
                  >
                    <option value="">Selecionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Objetivo e atividade */}
          {step === 1 && (
            <div className="onboarding-form-stack">
              <div className="form-group">
                <label className="form-label" htmlFor="nivel_atividade">Nível de atividade física</label>
                <select
                  id="nivel_atividade"
                  className="form-select"
                  value={form.nivel_atividade}
                  onChange={e => updateForm('nivel_atividade', e.target.value)}
                >
                  <option value="">Selecionar</option>
                  <option value="sedentario">🛋️ Sedentário (sem exercícios)</option>
                  <option value="leve">🚶 Leve (1-3x por semana)</option>
                  <option value="moderado">🏃 Moderado (3-5x por semana)</option>
                  <option value="intenso">💪 Intenso (6-7x por semana)</option>
                  <option value="muito_intenso">🔥 Muito Intenso (atleta)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="objetivo">Objetivo principal</label>
                <select
                  id="objetivo"
                  className="form-select"
                  value={form.objetivo}
                  onChange={e => updateForm('objetivo', e.target.value)}
                >
                  <option value="">Selecionar</option>
                  <option value="emagrecimento">🎯 Emagrecimento</option>
                  <option value="manutencao">⚖️ Manutenção de peso</option>
                  <option value="ganho_muscular">💪 Ganho de massa muscular</option>
                  <option value="saude_geral">❤️ Saúde geral</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Restrições */}
          {step === 2 && (
            <div className="onboarding-form-stack">
              <div>
                <p className="onboarding-hint">
                  Selecione suas restrições alimentares (opcional):
                </p>
                <div className="checkbox-grid">
                  {RESTRICOES_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`checkbox-item ${form.restricoes.includes(opt.value) ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.restricoes.includes(opt.value)}
                        onChange={() => toggleRestricao(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <p className="onboarding-status">
                  {form.restricoes.length === 0
                    ? 'Nenhuma restrição selecionada'
                    : `${form.restricoes.length} restrição(ões) selecionada(s)`}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="form-error mt-16">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Actions */}
          <div className="onboarding-footer">
            {step > 0 && (
              <button
                className="btn btn-outline flex-1"
                onClick={() => setStep(prev => prev - 1)}
              >
                ← Voltar
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary flex-1"
                onClick={nextStep}
              >
                Continuar →
              </button>
            ) : (
              <button
                className="btn btn-primary flex-1"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Salvando...
                  </>
                ) : '🚀 Criar meu plano!'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
