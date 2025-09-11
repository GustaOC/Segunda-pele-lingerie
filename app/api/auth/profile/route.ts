// app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Criar cliente Supabase server-side
    const supabase = await createServerSupabaseClient()

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário está tentando acessar seu próprio perfil
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nome, role, ativo')
      .eq('id', userId)
      .single()

    if (profileError) {
      // Se o perfil não existe, criar um básico
      if (profileError.code === 'PGRST116') {
        console.log(`📝 Criando perfil básico para usuário ${userId}`)
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            nome: user.email?.split('@')[0] || 'Usuário',
            role: 'ADMIN', // Por padrão, novos usuários são admin
            ativo: true,
          })
          .select('nome, role, ativo')
          .single()

        if (insertError) {
          console.error('Erro ao criar perfil:', insertError)
          return NextResponse.json(
            { error: 'Erro ao criar perfil do usuário' },
            { status: 500 }
          )
        }

        return NextResponse.json(newProfile)
      }

      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Erro inesperado na API de perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para atualizar perfil
export async function PUT(request: NextRequest) {
  try {
    const { nome, role } = await request.json()

    // Criar cliente Supabase server-side
    const supabase = await createServerSupabaseClient()

    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Atualizar perfil
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        nome,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('nome, role, ativo')
      .single()

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedProfile)

  } catch (error) {
    console.error('Erro inesperado na atualização de perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}