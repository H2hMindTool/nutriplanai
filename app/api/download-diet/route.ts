import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return new NextResponse('ID inválido', { status: 400 })

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Não autorizado', { status: 401 })

  const { data: diet } = await supabase
    .from('diet_requests')
    .select('dieta_texto, preferencia, created_at')
    .select('dieta_texto, preferencia, created_at, calorias, proteinas, carboidratos, gorduras')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!diet) return new NextResponse('Não encontrado', { status: 404 })

  const content = `PLANO ALIMENTAR PERSONALIZADO - NutriPlanAI
==================================================

Calorias: ${diet.calorias} kcal
Proteínas: ${diet.proteinas}g
Carboidratos: ${diet.carboidratos}g
Gorduras: ${diet.gorduras}g

--------------------------------------------------
${diet.dieta_texto}
--------------------------------------------------
Gerado por NutriPlanAI - nutriplanai.com.br
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="plano-alimentar-nutriplanai.txt"`,
    },
  })
}
