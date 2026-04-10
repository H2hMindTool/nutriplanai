import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SupportChatFull from '@/app/components/SupportChatFull'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="immersive-chat-layout">
      {/* Mini Header / Top Bar */}
      <div className="chat-top-bar">
        <Link href="/app/home" className="btn-chat-back">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Home
        </Link>
        <div className="chat-top-title">
          <span className="dot-online"></span>
          Suporte NutriPlanAI
        </div>
        <div className="w-48 h-10"></div> {/* Spacer for symmetry */}
      </div>

      <main className="chat-content-fixed">
        <SupportChatFull />
      </main>
    </div>
  )
}
