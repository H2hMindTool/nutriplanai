import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { dietId } = await request.json()

    if (!dietId) {
      return NextResponse.json({ error: 'ID do plano é necessário' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Deletar apenas se o plano pertencer ao usuário logado
    const { error } = await supabase
      .from('diet_requests')
      .delete()
      .eq('id', dietId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao deletar plano:', error)
      return NextResponse.json({ error: 'Falha ao deletar o plano' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
