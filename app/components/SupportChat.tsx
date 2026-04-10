'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'ai'
  content: string
}

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
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
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-window animate-fade-in-up">
          <div className="chat-window-header">
            <div className="flex items-center gap-8">
              <span className="chat-icon-emoji">🥗</span>
              <div>
                <div className="chat-header-info-title">NutriPlanAI Support</div>
                <div className="chat-header-info-status">• Online Agora</div>
              </div>
            </div>
            <button 
              className="btn btn-ghost btn-sm btn-close-chat" 
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg-ai chat-msg-loading">
                Digitando...
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <form onSubmit={handleSend} className="chat-input-row">
              <input
                type="text"
                className="form-input chat-input-custom"
                placeholder="Tire sua dúvida..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn-send-chat"
                disabled={loading}
              >
                {loading ? '...' : '🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

      <button 
        className="chat-bubble-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Dúvidas sobre sua dieta?"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  )
}
