// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only run middleware for admin routes
  if (!pathname.startsWith("/admin") || pathname === "/admin/register") {
    return NextResponse.next()
  }

  try {
    // Get token using JWT method
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Allow access to login page
    if (pathname === "/admin/login") {
      // Redirect if already logged in
      if (token) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      }
      return NextResponse.next()
    }

    // Protect all other admin routes
    if (!token) {
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(url)
    }

    // Check admin role
    if (token.role !== "ADMIN") {
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("error", "Unauthorized")
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
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