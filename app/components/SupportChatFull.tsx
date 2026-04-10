'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'ai'
  content: string
}

export default function SupportChatFull() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userName, setUserName] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadProfile() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
        if (data?.nome) {
          setUserName(data.nome)
          setMessages([{ role: 'ai', content: `Olá, ${data.nome}! Sou seu assistente NutriPlanAI. Como posso te ajudar com sua dieta hoje?` }])
        } else {
          setMessages([{ role: 'ai', content: 'Olá! Sou seu assistente NutriPlanAI. Como posso te ajudar com sua dieta hoje?' }])
        }
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: userMsg }].map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content
          }))
        })
      })

      const data = await response.json()
      if (data.content) {
        setMessages(prev => [...prev, { role: 'ai', content: data.content }])
      } else {
        throw new Error()
      }
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Ops, tive um problema para responder. Tente novamente em instantes.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-full-container">
      <div className="chat-full-header">
        <div className="flex items-center gap-12">
          <div className="chat-header-icon-large">🥗</div>
          <div>
            <h2 className="chat-full-title">Suporte NutriPlanAI</h2>
            <p className="chat-full-status">• Assistente de IA Online</p>
          </div>
        </div>
      </div>

      <div className="chat-full-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg-large ${m.role === 'user' ? 'chat-msg-user-large' : 'chat-msg-ai-large'}`}>
            <div className="chat-msg-content">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg-large chat-msg-ai-large chat-msg-loading">
            <span className="typing-indicator">Digitando...</span>
          </div>
        )}
      </div>

      <div className="chat-full-input-area">
        <div className="chat-input-wrapper">
          <form onSubmit={handleSend} className="chat-full-input-row">
            <textarea
              className="chat-input-textarea"
              placeholder="Pergunte qualquer coisa sobre sua dieta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e as any)
                }
              }}
              rows={1}
            />
            <button 
              type="submit" 
              className="btn-send-ai"
              disabled={loading || !input.trim()}
              title="Enviar mensagem"
            >
              {loading ? (
                <div className="btn-spinner-sm" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="send-icon">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </form>
          <p className="chat-disclaimer">
            NutriPlanAI pode cometer erros. Considere verificar informações importantes.
          </p>
        </div>
      </div>
    </div>
  )
}
