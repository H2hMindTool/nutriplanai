import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function calcularTMB(peso: number, altura: number, idade: number, sexo: string): number {
  if (sexo === 'masculino') {
    return 88.36 + (13.4 * peso) + (4.8 * altura) - (5.7 * idade)
  } else {
    return 447.6 + (9.2 * peso) + (3.1 * altura) - (4.3 * idade)
  }
}

function calcularGET(tmb: number, nivel: string): number {
  const fatores: Record<string, number> = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muito_intenso: 1.9,
  }
  return tmb * (fatores[nivel] || 1.55)
}

function ajustarCaloriasObjetivo(get: number, objetivo: string) {
  switch (objetivo) {
    case 'emagrecimento': return Math.round(get * 0.80)
    case 'manutencao': return Math.round(get)
    case 'ganho_muscular': return Math.round(get * 1.15)
    case 'saude_geral': return Math.round(get * 0.95)
    default: return Math.round(get)
  }
}

function objetivoLabel(obj: string): string {
  const labels: Record<string, string> = {
    emagrecimento: 'Emagrecimento',
    manutencao: 'Manutenção de Peso',
    ganho_muscular: 'Ganho de Massa Muscular',
    saude_geral: 'Saúde Geral',
  }
  return labels[obj] || obj
}

function nivelAtividadeLabel(nivel: string): string {
  const labels: Record<string, string> = {
    sedentario: 'Sedentário',
    leve: 'Levemente ativo',
    moderado: 'Moderadamente ativo',
    intenso: 'Intensamente ativo',
    muito_intenso: 'Atleta / Muito intenso',
  }
  return labels[nivel] || nivel
}

export async function POST(request: NextRequest) {
  try {
    const { dietId } = await request.json()

    if (!dietId) {
      return NextResponse.json({ error: 'dietId é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()
    const admin = createAdminClient()

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar diet_request
    const { data: dietRequest, error: dietError } = await admin
      .from('diet_requests')
      .select('*')
      .eq('id', dietId)
      .eq('user_id', user.id)
      .single()

    if (dietError || !dietRequest) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Marcar como processing
    await admin
      .from('diet_requests')
      .update({ status: 'processing' })
      .eq('id', dietId)

    // Buscar perfil nutricional
    const { data: np, error: npError } = await admin
      .from('nutritional_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (npError || !np) {
      await admin.from('diet_requests').update({ status: 'error' }).eq('id', dietId)
      return NextResponse.json({ error: 'Perfil nutricional não encontrado' }, { status: 404 })
    }

    // Calcular calorias
    const tmb = calcularTMB(np.peso, np.altura, np.idade, np.sexo)
    const get = calcularGET(tmb, np.nivel_atividade)
    const calorias = ajustarCaloriasObjetivo(get, np.objetivo)
    const proteinas = Math.round((calorias * 0.30) / 4)
    const carboidratos = Math.round((calorias * 0.20) / 4)
    const gorduras = Math.round((calorias * 0.50) / 9)

    const restricoesTexto = np.restricoes?.length > 0
      ? `Restrições alimentares: ${np.restricoes.join(', ')}.`
      : 'Sem restrições alimentares específicas.'

    const prompt = `Você é um nutricionista especialista em dietas Low Carb e Cetogênicas. Crie um PLANO MENSAL ESTRUTURADO detalhado e personalizado para o seguinte perfil:

**DADOS DO PACIENTE:**
- Sexo: ${np.sexo}
- Idade: ${np.idade} anos
- Peso: ${np.peso} kg
- Altura: ${np.altura} cm
- IMC: ${(np.peso / ((np.altura / 100) ** 2)).toFixed(1)}
- Nível de atividade: ${nivelAtividadeLabel(np.nivel_atividade)}
- Objetivo: ${objetivoLabel(np.objetivo)}
- ${restricoesTexto}
- Preferências alimentares: ${dietRequest.preferencia}

**METAS NUTRICIONAIS DIÁRIAS CALCULADAS (MÉDIA):**
- Calorias: ${calorias} kcal
- Proteínas: ${proteinas}g (30%)
- Carboidratos: ${carboidratos}g (20% - Low Carb)
- Gorduras boas: ${gorduras}g (50%)

**ESTRUTURA OBRIGATÓRIA DO PLANO:**
Crie um protocolo completo para uma semana inteira (7 dias de Segunda a Domingo) que servirá de base para o mês:

1. **Protocolo Diário (Segunda a Domingo)**: Para cada dia, forneça 5 refeições (Café, Lanche M, Almoço, Lanche T, Jantar) com ingredientes, gramagens e modo de preparo.
2. **Variações Estratégicas**: Indique pequenas variações para as Semanas 2, 3 e 4 do mês para manter a dieta dinâmica.
3. **Guia de Rotação Mensal**: Explique como alternar os dias para manter o metabolismo ativo.

Ao final, inclua uma **Lista de Compras Semanal** organizada por categorias.

Responda em português brasileiro. Seja prático, motivador e detalhado.`

    // Gerar dieta em texto
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    })

    const dietaTexto = response.choices[0].message.content || ''

    // Converter para HTML formatado e extrair Lista de Compras JSON
    const htmlPrompt = `Converta o plano alimentar semanal em HTML semântico e visualmente agradável.

REGRAS PARA O HTML:
- Cada dia (Segunda, Terça, etc.) deve começar com uma tag <h2>
- Use <h3> para o nome das refeições
- Use apenas as tags: h1, h2, h3, p, ul, li, strong, div
- Adicione class="day-section" nas seções de cada dia
- Adicione class="meal-box" em divs de refeições
- Não inclua <html>, <head>, <body>, nem CSS externo
- Mantenha todo o conteúdo do guia mensal e das variações

REGRAS PARA A LISTA DE COMPRAS:
- Após o HTML, adicione uma seção especial delimitada por <shopping_list_json> protegendo o conteúdo JSON.
- O JSON deve ser um array consolidado para a semana: [{"item": "nome do item", "categoria": "Proteínas|Vegetais|Gorduras|Outros", "comprado": false}]

TEXTO DO PLANO:
${dietaTexto}`

    const htmlResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: htmlPrompt }],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const fullContent = htmlResponse.choices[0].message.content || ''
    
    // Separar HTML de JSON
    let dietaHtml = fullContent.split('<shopping_list_json>')[0] || ''
    const shoppingListRaw = fullContent.split('<shopping_list_json>')[1]?.split('</shopping_list_json>')[0] || '[]'
    
    let listaComprasJson = []
    try {
      listaComprasJson = JSON.parse(shoppingListRaw.replace(/```json|```/g, '').trim())
    } catch (e) {
      console.error('Erro ao processar JSON da lista de compras:', e)
    }

    // Limpar markdown de bloco de código se existir no HTML
    if (dietaHtml.includes('```')) {
      dietaHtml = dietaHtml.replace(/```html|```/g, '').trim()
    }

    // Salvar no banco
    await admin
      .from('diet_requests')
      .update({
        dieta_texto: dietaTexto,
        dieta_html: dietaHtml,
        lista_compras: listaComprasJson,
        calorias: calorias,
        proteinas: proteinas,
        carboidratos: carboidratos,
        gorduras: gorduras,
        status: 'done',
      })
      .eq('id', dietId)

    return NextResponse.json({ success: true, dietId })
  } catch (error) {
    console.error('Erro na geração da dieta:', error)
    
    // Tentar marcar como erro
    try {
      const { dietId } = await (request.clone()).json()
      if (dietId) {
        const admin = createAdminClient()
        await admin.from('diet_requests').update({ status: 'error' }).eq('id', dietId)
      }
    } catch { /* ignore */ }

    return NextResponse.json(
      { error: 'Erro interno na geração da dieta' },
      { status: 500 }
    )
  }
}
