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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function loadProfile() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('nome').eq('id', user.id).single()
        if (data?.nome) {
          setUserName(data.nome)
          setMessages([{ role: 'ai', content: `Olá, ${data.nome}! Como posso te ajudar hoje?` }])
        } else {
          setMessages([{ role: 'ai', content: 'Olá! Como posso te ajudar hoje?' }])
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

  // Auto-ajuste da altura do campo de texto
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

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
      <div className="chat-full-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg-large ${m.role === 'user' ? 'chat-msg-user-large' : 'chat-msg-ai-large'}`}>
            <div className="chat-msg-content">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg-large chat-msg-ai-large">
            <div className="chat-msg-content typing-box">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-full-input-area">
        <div className="chat-input-wrapper-zen">
          <form onSubmit={handleSend} className="chat-full-input-row">
            <textarea
              ref={textareaRef}
              className="chat-input-textarea"
              placeholder="Digite sua dúvida..."
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
              className="btn-send-zen"
              disabled={loading || !input.trim()}
              title="Enviar mensagem"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
                <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
