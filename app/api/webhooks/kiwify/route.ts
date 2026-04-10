import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface KiwifyPayload {
  order_id: string
  order_status: 'paid' | 'refunded' | 'waiting_payment' | 'refused'
  customer: {
    name: string
    email: string
    mobile: string
  }
  Product?: {
    product_name?: string
  }
}

function verifyKiwifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-kiwify-signature') || 
                      request.nextUrl.searchParams.get('signature') || ''

    // Verificar assinatura (apenas em produção)
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      try {
        const isValid = verifyKiwifySignature(body, signature, webhookSecret)
        if (!isValid) {
          console.warn('[Kiwify] Assinatura inválida')
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
        }
      } catch {
        console.warn('[Kiwify] Erro na verificação de assinatura')
      }
    }

    const payload: KiwifyPayload = JSON.parse(body)
    const { order_status, customer } = payload

    if (!customer?.email) {
      return NextResponse.json({ error: 'Email do cliente não encontrado' }, { status: 400 })
    }

    const admin = createAdminClient()
    const email = customer.email.toLowerCase().trim()
    const nome = customer.name || ''
    const telefone = customer.mobile || ''

    console.log(`[Kiwify] Evento: ${order_status} | Email: ${email}`)

    if (order_status === 'paid') {
      // Verificar se usuário já existe no Auth
      const { data: existingUsers } = await admin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === email)

      if (existingUser) {
        // Usuário já existe → apenas ativar
        await admin
          .from('profiles')
          .update({ usuario_ativo: true, nome, telefone })
          .eq('id', existingUser.id)

        console.log(`[Kiwify] Usuário reativado: ${email}`)
      } else {
        // Criar novo usuário no Auth
        const tempPassword = crypto.randomBytes(12).toString('base64url')
        
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { nome, telefone },
        })

        if (createError) {
          console.error('[Kiwify] Erro ao criar usuário:', createError)
          return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
        }

        if (newUser.user) {
          // Atualizar profile (criado pelo trigger)
          await admin
            .from('profiles')
            .update({ usuario_ativo: true, nome, telefone })
            .eq('id', newUser.user.id)

          // Enviar magic link por e-mail (convite para definir senha)
          await admin.auth.admin.generateLink({
            type: 'recovery',
            email,
          })

          console.log(`[Kiwify] Usuário criado e ativado: ${email}`)
        }
      }

    } else if (order_status === 'refunded' || order_status === 'refused') {
      // Desativar conta
      const { data: existingUsers } = await admin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === email)

      if (existingUser) {
        await admin
          .from('profiles')
          .update({ usuario_ativo: false })
          .eq('id', existingUser.id)

        console.log(`[Kiwify] Conta desativada: ${email}`)
      }
    }

    return NextResponse.json({ success: true, processed: order_status })
  } catch (error) {
    console.error('[Kiwify] Erro no webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
