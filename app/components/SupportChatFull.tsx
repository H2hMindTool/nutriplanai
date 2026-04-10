'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'ai'
  content: string
}

export default function SupportChatFull() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function initChat() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch History
      const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50)

      if (history && history.length > 0) {
        setMessages(history.map(m => ({
          role: m.role === 'assistant' ? 'ai' : 'user',
          content: m.content
        })))
      } else {
        // 2. Fetch User Name for Greeting if no history
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome')
          .eq('id', user.id)
          .single()

        const greeting = profile?.nome 
          ? `Olá, ${profile.nome}! Sou seu assistente NutriPlanAI. Como posso te ajudar com sua dieta hoje?`
          : 'Olá! Sou seu assistente NutriPlanAI. Como posso te ajudar com sua dieta hoje?'
        
        setMessages([{ role: 'ai', content: greeting }])
      }
    }
    initChat()
  }, [supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Pre-add to UI
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    // 1. Save User Message to Supabase
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: userMsg
    })

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
        // 2. Add AI Response to UI
        setMessages(prev => [...prev, { role: 'ai', content: data.content }])
        
        // 3. Save AI Message to Supabase
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: data.content
        })
      } else {
        throw new Error()
      }
    } catch {
      const errorMsg = 'Ops, tive um problema para responder. Tente novamente em instantes.'
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-full-container">
      <div className="chat-full-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg-large ${m.role === 'user' ? 'chat-msg-user-gpt' : 'chat-msg-ai-gpt'}`}>
            <div className="chat-msg-content">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg-large chat-msg-ai-gpt">
            <div className="chat-msg-content typing-box">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-full-input-area">
        <div className="chat-input-wrapper-gpt">
          <form onSubmit={handleSend} className="chat-full-input-row">
            <textarea
              ref={textareaRef}
              className="chat-input-textarea"
              placeholder="Pergunte ao NutriPlanAI..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e as any)
                }
              }}
              rows={1}
            />

            {/* Send Button on the RIGHT */}
            <button 
              type="submit" 
              className="btn-send-gpt"
              disabled={loading || !input.trim()}
              title="Enviar mensagem"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
                <path d="M12 18V6M12 6L7 11M12 6L17 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
