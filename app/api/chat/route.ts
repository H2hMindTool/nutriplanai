import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { messages } = await req.json()

    // Buscar contexto do usuário (último plano) para o chat ter contexto
    const { data: latestDiet } = await supabase
      .from('diet_requests')
      .select('preferencia, dieta_texto')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const context = latestDiet 
      ? `O usuário já possui um plano alimentar gerado baseado em: "${latestDiet.preferencia}". Use as informações desse plano para responder dúvidas específicas se necessário: ${latestDiet.dieta_texto.substring(0, 1000)}...`
      : 'O usuário ainda não gerou um plano completo.'

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é o NutriPlanAI Assistant, um nutricionista virtual especializado em estratégias Low Carb e Cetogênicas. 
          Sua missão é ajudar o usuário com dúvidas rápidas sobre nutrição, substituições de alimentos no plano gerado e dicas para manter o foco.
          Mantenha as respostas curtas, profissionais e motivadoras.
          Contexto atual do usuário: ${context}`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const answer = response.choices[0].message.content
    return NextResponse.json({ content: answer })

  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro no Chat API:', error.message)
    } else {
      console.error('Erro no Chat API:', error)
    }
    return NextResponse.json({ error: 'Erro ao processar sua dúvida.' }, { status: 500 })
  }
}
