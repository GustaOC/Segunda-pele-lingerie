// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import supabaseConfig from '@/lib/supabase/config'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()

  // Desestruturamos a configuração de cookies para remover a propriedade 'name' que causa o conflito.
  const { name: _, ...cookieOptionsFromConfig } = supabaseConfig.cookies

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Agora usamos a configuração sem o 'name' para evitar o conflito.
            cookieStore.set({ name, value, ...options, ...cookieOptionsFromConfig })
          } catch (error) {
            console.warn(`[Supabase Login Route] Falha ao definir o cookie '${name}':`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Fazemos o mesmo para a função de remover.
            cookieStore.set({ name, value: '', ...options, ...cookieOptionsFromConfig, maxAge: 0 })
          } catch (error) {
            console.warn(`[Supabase Login Route] Falha ao remover o cookie '${name}':`, error)
          }
        },
      },
    }
  )

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Erro de login do Supabase:', error.message)
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'Erro ao fazer login' },
        { status: 500 }
      )
    }

    if (!user) {
        return NextResponse.json(
            { error: 'Usuário não encontrado após o login.' },
            { status: 500 }
        )
    }
    
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.warn('Aviso: Erro ao buscar perfil do usuário após o login:', profileError.message)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nome: userProfile?.nome || user.user_metadata?.name || '',
        role: userProfile?.role || 'user',
      },
    })

  } catch (error) {
    console.error('Erro inesperado no endpoint de login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}