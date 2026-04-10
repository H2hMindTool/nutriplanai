import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SupportChatFull from '@/app/components/SupportChatFull'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="immersive-chat-layout-zen">
      {/* Mini Header / Top Bar Zen */}
      <div className="chat-top-bar-zen">
        <Link href="/app/home" className="btn-back-zen" title="Voltar para o Início">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="chat-top-title-zen">Suporte</div>
        <div className="w-40"></div> {/* Spacer */}
      </div>

      <main className="chat-content-fixed">
        <SupportChatFull />
      </main>
    </div>
  )
}
