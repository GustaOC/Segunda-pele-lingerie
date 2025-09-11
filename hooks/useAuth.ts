// hooks/useAuth.ts

"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface AuthUser extends User {
  profile?: {
    nome?: string
    role?: string
    ativo?: boolean
  }
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

export type UseAuthReturn = AuthState & AuthActions

const INITIAL_STATE: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>(INITIAL_STATE)
  const router = useRouter()
  const mountedRef = useRef(true)
  const initializingRef = useRef(false)
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null)

  const getSupabase = useCallback((): SupabaseClient<Database> | null => {
    if (typeof window === 'undefined') {
      return null
    }
    if (supabaseRef.current) {
      return supabaseRef.current
    }
    try {
      const { createClient } = require('@/lib/supabase/client')
      supabaseRef.current = createClient()
      return supabaseRef.current
    } catch (error) {
      console.error('Erro ao criar cliente Supabase:', error)
      return null
    }
  }, [])

  const updateState = useCallback((updates: Partial<AuthState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }))
    }
  }, [])

  const fetchUserProfile = useCallback(async (user: User): Promise<AuthUser> => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${user.id}`,
        },
      })

      if (response.ok) {
        const profile = await response.json()
        return { ...user, profile }
      }
    } catch (error) {
      console.warn('Erro ao buscar perfil:', error)
    }
    return user
  }, [])

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) return
    initializingRef.current = true
    updateState({ loading: true })

    try {
      console.log('🔐 Inicializando autenticação...')
      const supabase = getSupabase()
      if (!supabase) {
        console.log('⚠️ Cliente Supabase não disponível (provavelmente SSR)')
        updateState({ user: null, session: null, isAuthenticated: false })
        return
      }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError)
        updateState({ user: null, session: null, error: 'Erro ao verificar sessão', isAuthenticated: false })
        return
      }
      if (session?.user) {
        console.log('✅ Sessão ativa encontrada:', session.user.email)
        let authUser: AuthUser = session.user
        updateState({ user: authUser, session, error: null, isAuthenticated: true })
        fetchUserProfile(session.user)
          .then((userWithProfile) => { if (mountedRef.current) { updateState({ user: userWithProfile }) } })
          .catch((error) => { console.warn('Falha ao buscar perfil:', error) })
      } else {
        console.log('❌ Nenhuma sessão ativa encontrada')
        updateState({ user: null, session: null, error: null, isAuthenticated: false })
      }
    } catch (error) {
      console.error('Erro na inicialização da auth:', error)
      updateState({ user: null, session: null, error: 'Erro inesperado na autenticação', isAuthenticated: false })
    } finally {
      initializingRef.current = false
      updateState({ loading: false })
    }
  }, [updateState, fetchUserProfile, getSupabase])

  // ==================================================================
  // ALTERAÇÃO PRINCIPAL ABAIXO
  // ==================================================================
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    updateState({ loading: true, error: null })

    try {
      // 1. Chamar a NOSSA API de login no servidor
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const result = await response.json()

      // 2. Verificar se a API retornou um erro
      if (!response.ok) {
        const errorMessage = result.error || 'Erro desconhecido no servidor'
        updateState({ error: errorMessage })
        return { success: false, error: errorMessage }
      }

      // 3. Se a API teve sucesso, o cookie de sessão JÁ FOI CRIADO.
      // Agora, precisamos sincronizar o estado do cliente Supabase com essa nova sessão.
      const supabase = getSupabase()
      if (supabase) {
        // Força o cliente supabase-js a recarregar a sessão a partir do cookie
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.error("Erro ao sincronizar sessão no cliente:", refreshError)
        } else {
           console.log('✅ Sessão do cliente sincronizada com sucesso.')
        }
      }

      // 4. Atualizar o estado local do hook com os dados do usuário retornados pela API
      updateState({
        user: result.user,
        session: (await supabase?.auth.getSession())?.data.session ?? null,
        error: null,
        isAuthenticated: true,
      })

      console.log('✅ Login via API bem-sucedido:', result.user.email)
      return { success: true }

    } catch (error) {
      console.error('Erro inesperado ao chamar a API de login:', error)
      const errorMessage = 'Erro de comunicação com o servidor'
      updateState({ error: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      updateState({ loading: false })
    }
  }, [updateState, getSupabase])
  // ==================================================================
  // FIM DA ALTERAÇÃO PRINCIPAL
  // ==================================================================

  const signOut = useCallback(async () => {
    updateState({ loading: true })
    try {
      const supabase = getSupabase()
      if (!supabase) {
        updateState({ user: null, session: null, error: null, isAuthenticated: false })
        router.push('/admin/login')
        return
      }
      const { error } = await supabase.auth.signOut()
      if (error) { throw error }
      supabaseRef.current = null
      updateState({ user: null, session: null, error: null, isAuthenticated: false })
      console.log('✅ Logout realizado com sucesso')
      router.push('/admin/login')
    } catch (error) {
      console.error('Erro no logout:', error)
      updateState({ error: 'Erro no logout' })
    } finally {
      updateState({ loading: false })
    }
  }, [updateState, router, getSupabase])

  const refreshSession = useCallback(async () => {
    await initializeAuth()
  }, [initializeAuth])

  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [updateState])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        initializeAuth()
      }, 0)
      return () => clearTimeout(timer)
    } else {
      updateState({ loading: false })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supabase = getSupabase()
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔄 Auth event: ${event}`)
      if (event === 'SIGNED_OUT') {
        updateState({ user: null, session: null, error: null, isAuthenticated: false })
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        let authUser: AuthUser = session.user
        updateState({ user: authUser, session, error: null, isAuthenticated: true })
        fetchUserProfile(session.user)
          .then((userWithProfile) => { if (mountedRef.current) { updateState({ user: userWithProfile }) } })
          .catch((error) => { console.warn('Falha ao buscar perfil:', error) })
      }
    })
    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [getSupabase, updateState, fetchUserProfile])

  return {
    ...state,
    signIn,
    signOut,
    refreshSession,
    clearError,
  }
}