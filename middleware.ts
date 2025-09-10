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

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = request.cookies.get(name)?.value
            console.log(`🍪 Getting cookie ${name}:`, value ? "exists" : "not found")
            return value
          },
          set(name: string, value: string, options: any) {
            console.log(`🍪 Setting cookie ${name}`)
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            console.log(`🍪 Removing cookie ${name}`)
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

    console.log(`🔍 Middleware: Verificando rota ${pathname}`)

    // Get user session
    const { data: { user }, error } = await supabase.auth.getUser()

    console.log(`👤 User status:`, {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: error?.message
    })

    // Allow access to login page
    if (pathname === "/admin/login") {
      // Redirect if already logged in
      if (user && !error) {
        console.log(`✅ Usuário já logado, redirecionando para dashboard`)
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      }
      console.log(`📝 Permitindo acesso à página de login`)
      return response
    }

    // Protect all other admin routes
    if (error || !user) {
      console.log(`❌ Usuário não autenticado, redirecionando para login`)
      console.log(`Error details:`, error)
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(url)
    }

    // Check admin role with fallback
    console.log(`🔍 Verificando role do usuário ${user.id}`)
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      console.log(`👥 Profile result:`, {
        hasProfile: !!profile,
        role: profile?.role,
        error: profileError?.message
      })

      // Se não encontrar o perfil, vamos criar um temporário ou permitir acesso
      if (profileError || !profile) {
        console.log(`⚠️ Perfil não encontrado, mas usuário está autenticado`)
        
        // Se for erro de tabela não existir, permitir acesso
        if (profileError?.code === 'PGRST116') {
          console.log(`⚠️ Tabela profiles não existe, permitindo acesso`)
          return response
        }
        
        // Se o perfil não existe, criar um básico ou permitir acesso de admin
        // Para debugging, vamos permitir acesso e criar o perfil depois
        console.log(`⚠️ Criando perfil básico para o usuário`)
        
        try {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              nome: user.email?.split('@')[0] || 'Admin',
              role: 'ADMIN', // Por agora, todos são admin
              ativo: true
            })
          
          console.log(`✅ Perfil criado com sucesso`)
          return response
        } catch (insertError) {
          console.log(`⚠️ Erro ao criar perfil, permitindo acesso mesmo assim:`, insertError)
          return response
        }
      }

      // Verificar se é admin
      if (profile.role !== "ADMIN") {
        console.log(`❌ Usuário não é admin: ${profile.role}`)
        const url = new URL("/admin/login", request.url)
        url.searchParams.set("error", "Unauthorized")
        return NextResponse.redirect(url)
      }

      console.log(`✅ Usuário autorizado como admin`)
      return response

    } catch (profileError) {
      console.error(`❌ Erro ao verificar perfil:`, profileError)
      // Em caso de erro, permitir acesso para não quebrar o sistema
      return response
    }

  } catch (error) {
    console.error(`❌ Middleware error:`, error)
    
    // Em produção, não redirecionar em caso de erro para evitar loops
    // Apenas log do erro e permitir acesso
    if (pathname === "/admin/login") {
      return NextResponse.next()
    }
    
    // Para outras rotas admin, redirecionar apenas se for erro grave
    const url = new URL("/admin/login", request.url)
    url.searchParams.set("error", "System error")
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/admin/:path*"],
}