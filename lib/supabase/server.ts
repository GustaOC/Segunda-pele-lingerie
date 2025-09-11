// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import supabaseConfig from './config'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: supabaseConfig.cookies.secure,
              sameSite: supabaseConfig.cookies.sameSite,
              maxAge: supabaseConfig.cookies.lifetime,
            })
          } catch (error) {
            // Cookies já foram enviados - isso é normal em alguns casos
            if (process.env.NODE_ENV === 'development') {
              console.warn('Não foi possível definir cookie:', name, error)
            }
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              httpOnly: true,
              secure: supabaseConfig.cookies.secure,
              sameSite: supabaseConfig.cookies.sameSite,
              maxAge: 0,
            })
          } catch (error) {
            // Cookies já foram enviados - isso é normal em alguns casos
            if (process.env.NODE_ENV === 'development') {
              console.warn('Não foi possível remover cookie:', name, error)
            }
          }
        },
      },
      auth: {
        autoRefreshToken: false, // No server-side não fazemos refresh
        persistSession: false,   // No server-side não persistimos
        detectSessionInUrl: false, // No server-side não detectamos da URL
      },
      global: supabaseConfig.global,
    }
  )
}

// Utilitários server-side
export async function getServerSession() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao obter sessão no server:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Erro inesperado ao obter sessão no server:', error)
    return null
  }
}

export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Erro ao obter usuário no server:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Erro inesperado ao obter usuário no server:', error)
    return null
  }
}

export async function getUserProfile(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao obter perfil:', error)
      return null
    }
    
    return profile
  } catch (error) {
    console.error('Erro inesperado ao obter perfil:', error)
    return null
  }
}