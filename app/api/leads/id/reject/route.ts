import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json().catch(() => ({}))
    const { motivo, observacoes } = body

    // Atualizar o lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead')
      .update({ 
        status: 'REPROVADO', 
        motivoReprovacao: motivo, 
        observacoes: observacoes 
      })
      .eq('id', id)
      .select()
      .single()

    if (leadError) {
      console.error('Error updating lead:', leadError)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    // Criar histórico (opcional, se tiver a tabela)
    // await supabaseAdmin.from('leadHistory').insert(...)

    return NextResponse.json({ ok: true, lead })
  } catch (error) {
    console.error('Error in reject route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}