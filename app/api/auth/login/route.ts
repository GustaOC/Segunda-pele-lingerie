// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    // Validar entrada
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Erro de login do Supabase:', error.message)
      
      // Mensagens de erro mais específicas
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Email não confirmado. Verifique sua caixa de entrada.' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao fazer login' },
        { status: 500 }
      )
    }

    // Buscar informações adicionais do usuário se necessário
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError.message)
    }

    // Retornar resposta de sucesso
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        nome: userProfile?.nome || data.user.user_metadata?.name || '',
        role: userProfile?.role || 'user',
      },
      // O access_token já está sendo definido como cookie automaticamente pelo Supabase
    })

  } catch (error) {
    console.error('Erro inesperado no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}