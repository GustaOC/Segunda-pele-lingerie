// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar sessão atual
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar informações do perfil se necessário
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', session.user.id)
      .single()

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        nome: profile?.nome || session.user.user_metadata?.name || '',
        role: profile?.role || 'user',
      }
    })

  } catch (error) {
    console.error('Erro na verificação de sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}