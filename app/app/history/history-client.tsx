'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Diet {
  id: string
  preferencia: string
  status: string
  calorias: number | null
  created_at: string
}

interface HistoryClientProps {
  initialDiets: Diet[]
}

export default function HistoryClient({ initialDiets }: HistoryClientProps) {
  const [diets, setDiets] = useState(initialDiets)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(dietId: string) {
    setIsDeleting(dietId)
    setConfirmDeleteId(null)

    try {
      const response = await fetch('/api/delete-diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietId }),
      })

      if (response.ok) {
        setDiets(prev => prev.filter(d => d.id !== dietId))
        router.refresh()
      } else {
        alert('Erro ao excluir o plano. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro na deleção:', error)
      alert('Erro de conexão. Verifique sua internet.')
    } finally {
      setIsDeleting(null)
    }
  }

  function toggleConfirm(e: React.MouseEvent, dietId: string) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmDeleteId(prev => prev === dietId ? null : dietId)
  }

  if (diets.length === 0) {
    return (
      <div className="card history-empty">
        <span className="history-empty-emoji">🥗</span>
        <h2 className="history-empty-title">Nenhum plano ainda</h2>
        <p className="history-empty-desc">
          Gere seu primeiro plano alimentar personalizado agora!
        </p>
        <Link href="/app/home" className="btn btn-primary">
          ⚡ Criar primeiro plano
        </Link>
      </div>
    )
  }

  return (
    <div className="history-list">
      {diets.map((diet, i) => (
        <div 
          key={diet.id} 
          className={`history-item-container animate-fade-in-up stagger-${Math.min((i % 10) + 1, 10)}`}
        >
          <Link
            href={`/app/diet/${diet.id}`}
            className="history-item-link"
          >
            <div className="card card-hover">
              <div className="history-item-row">
                <div className="history-item-left">
                  <div className="history-item-icon">🥗</div>
                  <div>
                    <p className="history-item-title">
                      {diet.preferencia.length > 70
                        ? diet.preferencia.substring(0, 70) + '...'
                        : diet.preferencia}
                    </p>
                    <p className="history-item-date">
                      {new Date(diet.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="history-item-right">
                  {diet.calorias && (
                    <span className="badge badge-lime">
                      ⚡ {diet.calorias} kcal
                    </span>
                  )}
                  {confirmDeleteId === diet.id ? (
                    <div className="delete-confirm-group">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(diet.id)
                        }}
                        className="btn-confirm-delete"
                        disabled={isDeleting === diet.id}
                      >
                        {isDeleting === diet.id ? '...' : 'Excluir'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => toggleConfirm(e, diet.id)}
                        className="btn-cancel-delete"
                      >
                        Voltar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => toggleConfirm(e, diet.id)}
                      className="btn-delete-history"
                      title="Excluir plano"
                    >
                      🗑️
                    </button>
                  )}
                  <span className="history-arrow">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
