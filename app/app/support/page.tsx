import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SupportChatFull from '@/app/components/SupportChatFull'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="immersive-chat-layout-gpt">
      {/* Brand BG effects */}
      <div className="chat-bg-effects" />

      {/* Top Bar - Brand Standard GPT style */}
      <div className="chat-top-bar-gpt">
        <Link href="/app/home" className="btn-back-gpt" title="Voltar">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="chat-top-title-gpt">
          NutriPlan<span>AI</span> Suporte
        </div>
        <div className="w-40"></div> {/* Spacer */}
      </div>

      <main className="chat-content-fixed">
        <SupportChatFull />
      </main>
    </div>
  )
}
