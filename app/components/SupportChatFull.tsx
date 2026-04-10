'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'ai'
  content: string
}

export default function SupportChatFull() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Olá! Sou seu assistente NutriPlanAI. Em que posso te ajudar com sua dieta hoje?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
        <form onSubmit={handleSend} className="chat-full-input-row">
          <input
            type="text"
            className="form-input chat-input-large"
            placeholder="Tire sua dúvida sobre nutrição ou sobre o app..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-send-large"
            disabled={loading}
          >
            {loading ? '...' : 'Enviar ✨'}
          </button>
        </form>
      </div>
    </div>
  )
}
