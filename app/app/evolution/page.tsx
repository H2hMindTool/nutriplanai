import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EvolutionClient from './evolution-client'

export default async function EvolutionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar perfil nutricional para saber o peso objetivo (se houver)
  const { data: nutrition } = await supabase
    .from('nutritional_profiles')
    .select('peso, objetivo')
    .eq('user_id', user.id)
    .single()

  // Buscar histórico de peso
  const { data: history } = await supabase
    .from('weight_history')
    .select('*')
    .eq('user_id', user.id)
    .order('recorded_at', { ascending: true })

  return (
    <div className="page-wrapper">
      {/* Navigation managed by global TopBar */}

      <main className="evolution-main">
        <div className="container">
          <div className="evolution-header animate-fade-in-up">
            <h1 className="evolution-title">
              📈 Minha <span>Evolução</span>
            </h1>
            <p className="evolution-desc">
              Acompanhe sua jornada e veja os resultados do seu esforço.
            </p>
          </div>

          <EvolutionClient 
            initialHistory={history || []} 
            startingWeight={nutrition?.peso || 0}
            userId={user.id}
          />
        </div>
      </main>

    </div>
  )
}
