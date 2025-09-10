import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only run middleware for admin routes
  if (!pathname.startsWith("/admin") || pathname === "/admin/register") {
    return NextResponse.next()
  }

  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Verificar se as variáveis de ambiente existem
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Middleware: Variáveis de ambiente do Supabase não encontradas:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey
      })
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("error", "Configuration error")
      return NextResponse.redirect(url)
    }

    console.log("✅ Middleware: Criando cliente Supabase...")

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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
            request.cookies.set({ name, value: "", ...options })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({ name, value: "", ...options })
          },
        },
      }
    )

    console.log("✅ Middleware: Verificando usuário...")
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ Middleware: Erro na autenticação:", authError.message)
    }

    console.log("🔍 Middleware: Status do usuário:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
      pathname
    })

    // Allow access to login page
    if (pathname === "/admin/login") {
      // Redirect if already logged in
      if (user && !authError) {
        console.log("✅ Middleware: Usuário já logado, redirecionando para dashboard")
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      }
      console.log("✅ Middleware: Permitindo acesso à página de login")
      return response
    }

    // Protect all other admin routes
    if (authError || !user) {
      console.log("❌ Middleware: Usuário não autenticado, redirecionando para login")
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(url)
    }

    // Check admin role - buscar do perfil do usuário
    console.log("🔍 Middleware: Verificando role do usuário...")
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error("❌ Middleware: Erro ao buscar perfil:", profileError.message)
        console.error("❌ Middleware: Detalhes do erro:", profileError)
        
        // Se a tabela não existir, vamos permitir acesso temporariamente
        if (profileError.code === 'PGRST116' || profileError.message.includes('relation "profiles" does not exist')) {
          console.log("⚠️ Middleware: Tabela profiles não existe, permitindo acesso temporariamente")
          return response
        }
      }

      console.log("🔍 Middleware: Perfil encontrado:", {
        hasProfile: !!profile,
        role: profile?.role
      })

      if (profile?.role !== "ADMIN") {
        console.log("❌ Middleware: Usuário não é admin:", profile?.role)
        const url = new URL("/admin/login", request.url)
        url.searchParams.set("error", "Unauthorized")
        return NextResponse.redirect(url)
      }

      console.log("✅ Middleware: Usuário autorizado como admin")
      return response

    } catch (profileError) {
      console.error("❌ Middleware: Erro inesperado ao verificar perfil:", profileError)
      // Permitir acesso em caso de erro de perfil por agora
      return response
    }

  } catch (error) {
    console.error("❌ Middleware: Erro geral:", error)
    console.error("❌ Middleware: Stack trace:", error instanceof Error ? error.stack : 'No stack trace')
    
    // Redirect to login on any error
    const url = new URL("/admin/login", request.url)
    url.searchParams.set("error", "System error")
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/admin/:path*"],
}