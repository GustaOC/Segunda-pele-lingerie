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

    const { data: { user }, error } = await supabase.auth.getUser()

    // Allow access to login page
    if (pathname === "/admin/login") {
      // Redirect if already logged in
      if (user && !error) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      }
      return response
    }

    // Protect all other admin routes
    if (error || !user) {
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(url)
    }

    // Check admin role - buscar do perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== "ADMIN") {
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("error", "Unauthorized")
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // Redirect to login on any error
    const url = new URL("/admin/login", request.url)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/admin/:path*"],
}