"use client"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session, SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import type React from "react"

// Tipos
export interface UserProfile {
  nome?: string
  role?: string
  ativo?: boolean
}

export interface AuthUser extends User {
  profile?: UserProfile
}

export interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider Props
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs para controle
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null)

  // Estado computado
  const isAuthenticated = !!user && !!session

  // Função para obter o cliente Supabase de forma segura
  const getSupabase = (): SupabaseClient<Database> => {
    if (!supabaseRef.current && typeof window !== 'undefined') {
      supabaseRef.current = createClient()
    }
    if (!supabaseRef.current) {
      throw new Error('Supabase client não disponível')
    }
    return supabaseRef.current
  }

  // Função para buscar perfil do usuário
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`/api/auth/profile?userId=${userId}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const profile = await response.json()
        return profile
      }
    } catch (error) {
      console.warn('Erro ao buscar perfil do usuário:', error)
    }

    return null
  }

  // Função para atualizar estado de forma segura
  const updateState = (updates: Partial<Pick<AuthContextType, 'user' | 'session' | 'loading' | 'error'>>) => {
    if (mountedRef.current) {
      if (updates.user !== undefined) setUser(updates.user)
      if (updates.session !== undefined) setSession(updates.session)
      if (updates.loading !== undefined) setLoading(updates.loading)
      if (updates.error !== undefined) setError(updates.error)
    }
  }

  // Função para processar sessão
  const processSession = async (newSession: Session | null) => {
    if (!newSession?.user) {
      console.log('🔐 AuthProvider: Limpando sessão')
      updateState({
        user: null,
        session: null,
        error: null,
      })
      return
    }

    try {
      console.log(`🔐 AuthProvider: Processando sessão para ${newSession.user.email}`)
      
      let authUser: AuthUser = newSession.user;
      
      updateState({
        user: authUser,
        session: newSession,
        error: null,
      })

      // Fetch profile asynchronously
      const profile = await fetchUserProfile(newSession.user.id)
      if (mountedRef.current && profile) {
        authUser = { ...authUser, profile }
        updateState({
          user: authUser,
        })
      }

      console.log(`✅ AuthProvider: Sessão processada com sucesso`)
    } catch (error) {
      console.error('❌ AuthProvider: Erro ao processar sessão:', error)
      updateState({
        error: 'Erro ao carregar dados do usuário',
      })
    }
  }

  // Função para inicializar autenticação
  const initializeAuth = async () => {
    if (initializingRef.current || typeof window === 'undefined') return
    initializingRef.current = true

    try {
      console.log('🚀 AuthProvider: Inicializando autenticação...')
      
      const supabase = getSupabase()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('❌ AuthProvider: Erro ao obter sessão:', sessionError)
        updateState({
          error: 'Erro ao verificar autenticação',
          loading: false,
        })
        return
      }

      await processSession(session)
      
    } catch (error) {
      console.error('❌ AuthProvider: Erro na inicialização:', error)
      updateState({
        error: 'Erro inesperado na autenticação',
      })
    } finally {
      updateState({ loading: false })
      initializingRef.current = false
    }
  }

  // Função de logout
  const signOut = async () => {
    try {
      updateState({ loading: true })
      
      console.log('🔓 AuthProvider: Realizando logout...')
      
      const supabase = getSupabase()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      // Limpar estado
      updateState({
        user: null,
        session: null,
        error: null,
        loading: false,
      })

      console.log('✅ AuthProvider: Logout realizado com sucesso')
    } catch (error) {
      console.error('❌ AuthProvider: Erro no logout:', error)
      updateState({
        error: 'Erro ao fazer logout',
        loading: false,
      })
      
      // Mesmo com erro, limpar o estado local
      setTimeout(() => {
        updateState({
          user: null,
          session: null,
        })
      }, 1000)
    }
  }

  // Função para atualizar autenticação
  const refreshAuth = async () => {
    updateState({ loading: true })
    await initializeAuth()
  }

  // Efeito de inicialização
  useEffect(() => {
    // Apenas inicializar no cliente
    if (typeof window === 'undefined') return

    initializeAuth()

    // Configurar listener para mudanças de autenticação
    const supabase = getSupabase()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`🔄 AuthProvider: Auth event - ${event}`)

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            await processSession(newSession)
            break
            
          case 'SIGNED_OUT':
            updateState({
              user: null,
              session: null,
              error: null,
            })
            break
            
          case 'PASSWORD_RECOVERY':
            console.log('🔑 AuthProvider: Recuperação de senha iniciada')
            break
            
          default:
            console.log(`🔄 AuthProvider: Evento não tratado - ${event}`)
        }
      }
    )

    // Cleanup
    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  // Valor do contexto
  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    signOut,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}

// Hook para compatibilidade com código existente
export function useSession() {
  const { user, session, loading } = useAuth()
  
  return {
    data: session ? { user, session } : null,
    status: loading ? "loading" : session ? "authenticated" : "unauthenticated",
  }
}

// Componente de loading
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2"></div>
        </div>
        <p className="text-slate-600 font-medium">Verificando autenticação...</p>
      </div>
    </div>
  )
}