import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rotas públicas
  const publicRoutes = ['/', '/login', '/acesso-negado', '/register']
  const isPublic = publicRoutes.some(r => pathname === r) || pathname.startsWith('/api/')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Busca perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('usuario_ativo, onboarding_done')
      .eq('id', user.id)
      .single()

    // Usuário inativo → acesso negado (exceto pra própria página)
    if (profile && !profile.usuario_ativo && !pathname.startsWith('/acesso-negado') && !pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/acesso-negado'
      return NextResponse.redirect(url)
    }

    // Onboarding não feito → redireciona para /onboarding
    if (profile && profile.usuario_ativo && !profile.onboarding_done && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Já logado tentando acessar /login → redireciona para /app/home
    if (pathname === '/login' || pathname === '/') {
      if (profile?.usuario_ativo) {
        const url = request.nextUrl.clone()
        url.pathname = profile.onboarding_done ? '/app/home' : '/onboarding'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
