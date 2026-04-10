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

    // 1. Buscar Perfil Básico (Nome)
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', user.id)
      .single()

    // 2. Buscar Perfil Nutricional (Biométria e Objetivos)
    const { data: nutrition } = await supabase
      .from('nutritional_profiles')
      .select('peso, altura, idade, sexo, nivel_atividade, objetivo, restricoes')
      .eq('user_id', user.id)
      .single()

    // 3. Buscar contexto do último plano (Resumido para economizar tokens)
    const { data: latestDiet } = await supabase
      .from('diet_requests')
      .select('preferencia, calorias, proteinas, carboidratos, gorduras')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const userContext = `
      Usuário: ${profile?.nome || 'Usuário'}
      Perfil: ${nutrition?.idade} anos, ${nutrition?.sexo}, ${nutrition?.peso}kg, ${nutrition?.altura}cm.
      Nível de Atividade: ${nutrition?.nivel_atividade}
      Objetivo: ${nutrition?.objetivo}
      Restrições: ${nutrition?.restricoes?.join(', ') || 'Nenhuma'}
      Último Plano Gerado: ${latestDiet ? `Baseado em "${latestDiet.preferencia}". Macros: ${latestDiet.calorias}kcal (P:${latestDiet.proteinas}g, C:${latestDiet.carboidratos}g, G:${latestDiet.gorduras}g)` : 'Nenhum plano gerado ainda.'}
    `

    // Limitar histórico para as últimas 10 mensagens
    const limitedMessages = messages.slice(-10)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é o NutriPlanAI Assistant, um nutricionista virtual especializado em estratégias Low Carb e Cetogênicas. 
          Sua missão é ajudar o usuário com dúvidas sobre nutrição, sugestões de refeições e motivação.
          SEMPRE use o contexto do perfil do usuário para dar respostas personalizadas. Use o nome do usuário ocasionalmente.
          Mantenha as respostas curtas, profissionais e amigáveis.
          
          DADOS DO USUÁRIO:
          ${userContext}`
        },
        ...limitedMessages
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
