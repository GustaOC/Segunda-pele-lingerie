"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { createContext, useContext } from "react"
import type React from "react"

// Definindo o tipo do contexto de auth
interface AuthContextType {
  auth: {
    isAuthenticated: boolean
    user: {
      email?: string | null
      name?: string | null
      role?: string
    } | null
  } | null
  logout: () => void
}

// Criando um contexto personalizado para manter compatibilidade
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthWrapper>{children}</AuthWrapper>
    </SessionProvider>
  )
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  
  const authContextValue: AuthContextType = {
    auth: {
      isAuthenticated: status === "authenticated" && !!session,
      user: session?.user ? {
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any)?.role || 'USER'
      } : null
    },
    logout: () => {
      // Usar signOut do NextAuth
      import('next-auth/react').then(({ signOut }) => {
        signOut({ callbackUrl: '/admin/login' })
      })
    }
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado que mantém a compatibilidade com o código existente
export function useAuth(): AuthContextType | null {
  return useContext(AuthContext)
}