'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ShoppingItem {
  item: string
  categoria: string
  comprado: boolean
}

interface Props {
  initialList: ShoppingItem[]
  dietId: string
}

export default function ShoppingListClient({ initialList, dietId }: Props) {
  const [list, setList] = useState<ShoppingItem[]>(initialList)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const toggleItem = async (index: number) => {
    const newList = [...list]
    newList[index].comprado = !newList[index].comprado
    setList(newList)
    
    // Persistência automática
    await persistChange(newList)
  }

  const persistChange = async (updatedList: ShoppingItem[]) => {
    setSaving(true)
    try {
      const res = await fetch('/api/update-shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietId, lista: updatedList }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Agrupar por categoria para exibição
  const grouped = list.reduce((acc, obj) => {
    const key = obj.categoria || 'Outros'
    if (!acc[key]) acc[key] = []
    acc[key].push(obj)
    return acc
  }, {} as Record<string, ShoppingItem[]>)

  return (
    <div className="shopping-list-client">
      {saving && (
        <div className="saving-indicator animate-pulse">
          <span>Salvando...</span>
        </div>
      )}

      {Object.entries(grouped).map(([categoria, itens]) => (
        <section key={categoria} className="shopping-category-section animate-fade-in-up">
          <h2 className="category-title">{categoria}</h2>
          <div className="card shopping-card">
            <ul className="shopping-items-list">
              {itens.map((item) => {
                // Encontrar o índice real na lista original para o toggle
                const originalIndex = list.findIndex(i => i.item === item.item && i.categoria === item.categoria)
                
                return (
                  <li 
                    key={`${item.item}-${originalIndex}`} 
                    className={`shopping-item ${item.comprado ? 'comprado' : ''}`}
                    onClick={() => toggleItem(originalIndex)}
                  >
                    <div className={`checkbox ${item.comprado ? 'checked' : ''}`}>
                      {item.comprado && <span>✓</span>}
                    </div>
                    <span className="item-name">{item.item}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ))}

      <div className="shopping-footer">
        <button 
          onClick={() => router.push(`/app/diet/${dietId}`)}
          className="btn btn-primary btn-lg btn-block"
        >
          Voltar para Dietas
        </button>
      </div>
    </div>
  )
}
