// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import supabaseConfig from './lib/supabase/config'

// Constantes de configuração
const PROTECTED_ROUTES = ['/admin']
const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/register']
const MAX_REDIRECT_ATTEMPTS = 3
const REDIRECT_HEADER = 'x-middleware-redirects'

// Tipos
interface MiddlewareContext {
  request: NextRequest
  pathname: string
  redirectCount: number
}

// Utilitários
function getRedirectCount(request: NextRequest): number {
  return parseInt(request.headers.get(REDIRECT_HEADER) || '0', 10)
}

function createRedirectResponse(url: string, request: NextRequest, incrementRedirect = true): NextResponse {
  const response = NextResponse.redirect(new URL(url, request.url))
  
  if (incrementRedirect) {
    const newCount = getRedirectCount(request) + 1
    response.headers.set(REDIRECT_HEADER, newCount.toString())
  }
  
  return response
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

function isPublicAdminRoute(pathname: string): boolean {
  return PUBLIC_ADMIN_ROUTES.includes(pathname)
}

async function createSupabaseMiddlewareClient(request: NextRequest): Promise<{
  supabase: ReturnType<typeof createServerClient>
  response: NextResponse
}> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )

  return { supabase, response }
}

async function validateAuthentication(
  supabase: ReturnType<typeof createServerClient>
): Promise<{ isValid: boolean; user: any | null; error: any | null }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn(`🔐 Middleware: Erro de autenticação: ${error.message}`)
      return { isValid: false, user: null, error }
    }

    if (!user) {
      console.log(`🔐 Middleware: Nenhum usuário autenticado`)
      return { isValid: false, user: null, error: null }
    }

    console.log(`✅ Middleware: Usuário autenticado: ${user.email}`)
    return { isValid: true, user, error: null }
  } catch (error) {
    console.error(`❌ Middleware: Erro inesperado na validação:`, error)
    return { isValid: false, user: null, error }
  }
}

export async function middleware(request: NextRequest) {
  const context: MiddlewareContext = {
    request,
    pathname: request.nextUrl.pathname,
    redirectCount: getRedirectCount(request),
  }

  // 1. Proteção anti-loop
  if (context.redirectCount >= MAX_REDIRECT_ATTEMPTS) {
    console.error(
      `🛑 LOOP DETECTADO: Muitos redirects (${context.redirectCount}) para ${context.pathname}`
    )
    
    // Em caso de loop, permitir acesso para quebrar o ciclo
    return NextResponse.next()
  }

  // 2. Permitir rotas não protegidas
  if (!isProtectedRoute(context.pathname)) {
    return NextResponse.next()
  }

  // 3. Permitir rotas públicas admin
  if (isPublicAdminRoute(context.pathname)) {
    console.log(`🟢 Middleware: Rota pública permitida: ${context.pathname}`)
    return NextResponse.next()
  }

  // 4. Validar autenticação para rotas protegidas
  console.log(`🔍 Middleware: Validando rota protegida: ${context.pathname}`)

  try {
    const { supabase, response } = await createSupabaseMiddlewareClient(request)
    const { isValid, user, error } = await validateAuthentication(supabase)

    if (!isValid) {
      console.log(`❌ Middleware: Redirecionando para login - Usuário não autenticado`)
      
      // Preservar URL original para redirecionamento após login
      const loginUrl = new URL('/admin/login', request.url)
      if (context.pathname !== '/admin/login') {
        loginUrl.searchParams.set('callbackUrl', context.pathname)
      }
      
      return createRedirectResponse(loginUrl.toString(), request)
    }

    // 5. Verificações adicionais de autorização (se necessário)
    // Aqui você pode adicionar verificação de role, permissões, etc.
    
    console.log(`✅ Middleware: Acesso autorizado para ${user.email} -> ${context.pathname}`)
    return response

  } catch (error) {
    console.error(`❌ Middleware: Erro crítico:`, error)
    
    // Em caso de erro crítico, redirecionar para login
    return createRedirectResponse('/admin/login', request)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}