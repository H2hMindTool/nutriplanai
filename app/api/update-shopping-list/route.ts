import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { dietId, lista } = await request.json()

    if (!dietId || !lista) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('diet_requests')
      .update({ lista_compras: lista })
      .eq('id', dietId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao atualizar lista de compras:', error)
      return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
    }

    // Revalidar para garantir que o refresh mostre os dados novos
    revalidatePath(`/app/shopping-list/${dietId}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
