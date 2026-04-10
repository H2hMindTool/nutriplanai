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

      {/* Background and chat content managed by global layout and TopBar */}

      <main className="chat-content-fixed">
        <SupportChatFull />
      </main>
    </div>
  )
}
