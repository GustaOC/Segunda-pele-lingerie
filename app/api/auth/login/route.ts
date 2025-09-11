// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Garante que a rota seja sempre executada no servidor e nunca estática
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const { email, password } = await req.json()

  // Validação básica de entrada
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email e senha são obrigatórios.' },
      { status: 400 }
    )
  }

  // Cria um cliente Supabase específico para esta Rota de API.
  // Ele vai ler e escrever cookies de forma segura no servidor.
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
            // Ignora o erro se os cabeçalhos já foram enviados.
            // Isso é um comportamento esperado em algumas situações no Next.js.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignora o erro se os cabeçalhos já foram enviados.
          }
        },
      },
    }
  )

  // Tenta fazer o login usando o método padrão do Supabase
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Se o Supabase retornar um erro, o tratamos aqui
  if (error) {
    console.error('Erro de login do Supabase:', error.message)
    if (error.message.includes('Invalid login credentials')) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu email e senha.' },
        { status: 401 }
      )
    }
    // Para outros erros, retornamos uma mensagem genérica
    return NextResponse.json(
      { error: 'Ocorreu um erro no servidor ao tentar fazer login.' },
      { status: 500 }
    )
  }

  // Se o login for bem-sucedido mas não retornar um usuário, é um erro inesperado
  if (!user) {
      return NextResponse.json(
          { error: 'Usuário não encontrado após o login.' },
          { status: 500 }
      )
  }
  
  // Opcional: Buscar dados adicionais do perfil do usuário após o login
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.warn('Aviso: Erro ao buscar perfil do usuário após o login:', profileError.message)
  }

  // Retorna uma resposta de sucesso com os dados do usuário para o frontend
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nome: userProfile?.nome || user.user_metadata?.name || '',
      role: userProfile?.role || 'user',
    },
  })
}