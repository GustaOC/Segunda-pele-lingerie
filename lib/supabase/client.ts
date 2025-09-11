// lib/supabase/client.ts
"use client"

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import supabaseConfig from './config'

// Singleton para garantir uma única instância
let supabaseClient: SupabaseClient<Database> | null = null

export function createClient(): SupabaseClient<Database> {
  // Se já temos uma instância, retorná-la
  if (supabaseClient) {
    return supabaseClient
  }

  // Criar nova instância
  supabaseClient = createBrowserClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      auth: supabaseConfig.auth,
      global: supabaseConfig.global,
      realtime: supabaseConfig.realtime,
    }
  )

  // Log para debugging (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Supabase client criado com configurações enterprise')
  }

  return supabaseClient
}

// Função helper para obter o cliente de forma segura (para componentes que podem renderizar no servidor)
export function getClientSafely(): SupabaseClient<Database> | null {
  if (typeof window === 'undefined') {
    return null
  }
  return createClient()
}

// Utilitários de autenticação
export const authUtils = {
  async getSession() {
    const client = createClient()
    return await client.auth.getSession()
  },

  async getUser() {
    const client = createClient()
    return await client.auth.getUser()
  },

  async signOut() {
    const client = createClient()
    const { error } = await client.auth.signOut()
    
    if (!error) {
      // Limpar instância para forçar recriação
      supabaseClient = null
      
      // Limpar storage manualmente para garantir
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(supabaseConfig.auth.storageKey)
        window.sessionStorage.removeItem(supabaseConfig.auth.storageKey)
      }
    }
    
    return { error }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = createClient()
    return client.auth.onAuthStateChange(callback)
  }
}

export default createClient