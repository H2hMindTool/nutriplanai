'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SupportChat from '@/app/components/SupportChat'

interface WeightEntry {
  id: string
  weight: number
  recorded_at: string
}

interface EvolutionClientProps {
  initialHistory: WeightEntry[]
  startingWeight: number
  userId: string
}

export default function EvolutionClient({ initialHistory, startingWeight, userId }: EvolutionClientProps) {
  const [history, setHistory] = useState<WeightEntry[]>(initialHistory)
  const [newWeight, setNewWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estados para o Modal de Exclusão
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault()
    if (!newWeight || isNaN(Number(newWeight))) {
      setError('Por favor, insira um peso válido.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const weightVal = Number(newWeight)
      const { data, error: dbError } = await supabase
        .from('weight_history')
        .insert([{ user_id: userId, weight: weightVal }])
        .select()
        .single()

      if (dbError) throw dbError

      if (data) {
        const updated = [...history, data].sort((a, b) => 
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        )
        setHistory(updated)
        setNewWeight('')
        router.refresh()
      }
    } catch (err) {
      setError('Erro ao salvar peso. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!itemToDelete) return
    
    setIsDeleting(true)
    try {
      const { error: dbError } = await supabase
        .from('weight_history')
        .delete()
        .eq('id', itemToDelete)

      if (dbError) throw dbError
      
      setHistory(prev => prev.filter(item => item.id !== itemToDelete))
      router.refresh()
      setItemToDelete(null)
    } catch (err) {
      console.error('Erro ao excluir registro:', err)
      alert('Não foi possível excluir o registro. Verifique sua conexão.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Lógica do Gráfico SVG
  const chartData = history.length > 0 ? history : []
  const maxWeight = Math.max(...chartData.map(d => d.weight), startingWeight || 0) + 5
  const minWeight = Math.min(...chartData.map(d => d.weight), startingWeight || 0) - 5
  const range = Math.max(maxWeight - minWeight, 1)

  const getX = (index: number) => (index / (Math.max(chartData.length - 1, 1))) * 100
  const getY = (weight: number) => 100 - ((weight - minWeight) / range) * 100

  const points = chartData.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(' ')

  return (
    <>
      <div className="evolution-grid">
        
        {/* Coluna Esquerda: Form e Lista */}
        <div className="evolution-sidebar">
          <div className="card weight-input-card">
            <h3 className="chart-title">⚖️ Registrar Peso</h3>
            <form onSubmit={handleAddWeight} className="flex flex-col gap-12 mt-16">
              <div className="form-group">
                <input 
                  type="number" 
                  step="0.1"
                  className="form-input" 
                  placeholder="Ex: 85.5"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Adicionar Registro'}
              </button>
            </form>
          </div>

          <div className="weight-log-list">
            <h4 className="form-label">Histórico Recente</h4>
            {history.length === 0 ? (
              <p className="text-muted text-sm py-16 text-center">Nenhum registro ainda.</p>
            ) : (
              history.slice().reverse().map(item => (
                <div key={item.id} className="weight-log-item animate-fade-in-up">
                  <div>
                    <div className="weight-val">{item.weight} kg</div>
                    <div className="weight-date">
                      {new Date(item.recorded_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <button 
                    onClick={() => setItemToDelete(item.id)}
                    className="btn-delete-history btn-delete-history-sm"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna Direita: Gráfico */}
        <div className="card evolution-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">📊 Curva de Progresso</h3>
            {history.length > 0 && (
              <span className="badge badge-lime">
                {history[history.length - 1].weight - history[0].weight < 0 
                  ? `📉 -${Math.abs(history[history.length - 1].weight - history[0].weight).toFixed(1)} kg`
                  : `📈 +${(history[history.length - 1].weight - history[0].weight).toFixed(1)} kg`
                }
              </span>
            )}
          </div>

          <div className="chart-container-svg">
            {history.length < 2 ? (
              <div className="flex-center w-full text-center p-32">
                <p className="text-muted">
                  Adicione pelo menos 2 registros para visualizar o gráfico de evolução.
                </p>
              </div>
            ) : (
              <svg viewBox="0 0 100 100" className="chart-line" preserveAspectRatio="none">
                <polyline
                  points={points}
                  className="chart-polyline chart-polyline-style"
                />
                {chartData.map((d, i) => (
                  <circle
                    key={d.id}
                    cx={getX(i)}
                    cy={getY(d.weight)}
                    r="1.5"
                    className="chart-point"
                  />
                ))}
              </svg>
            )}
            
            {/* Labels de Eixo (Simplificado) */}
            <div className="chart-axis-y">
              <span>{maxWeight.toFixed(0)} kg</span>
              <span>{minWeight.toFixed(0)} kg</span>
            </div>
          </div>

          <div className="mt-auto pt-16 border-t border-white-5 flex justify-between text-xs text-muted">
            <span>Início: {new Date(history[0]?.recorded_at || Date.now()).toLocaleDateString('pt-BR')}</span>
            <span>Último: {new Date(history[history.length - 1]?.recorded_at || Date.now()).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

      </div>

      <SupportChat />

      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-card animate-scale-in">
            <div className="modal-icon">🗑️</div>
            <h3 className="modal-title">Confirmar Exclusão</h3>
            <p className="modal-text">
              Deseja realmente excluir este registro de peso? Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions">
              <button 
                className="btn btn-ghost" 
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
