// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Garante que a rota seja sempre executada no servidor e nunca estática
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email e senha são obrigatórios.' },
      { status: 400 }
    )
  }

  // Cria um cliente Supabase específico para esta Rota de API
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignora o erro se os cabeçalhos já foram enviados
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignora o erro se os cabeçalhos já foram enviados
          }
        },
      },
    }
  )

  // Tenta fazer o login usando o método padrão do Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Erro de login do Supabase:', error.message)
    if (error.message.includes('Invalid login credentials')) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu email e senha.' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Ocorreu um erro no servidor ao tentar fazer login.' },
      { status: 500 }
    )
  }

  // Opcional: Você pode querer buscar dados de uma tabela 'profiles'
  // que tenha uma relação com 'auth.users' pelo ID.
  // Isso é um padrão comum e recomendado.

  return NextResponse.json({ success: true, user: data.user })
}