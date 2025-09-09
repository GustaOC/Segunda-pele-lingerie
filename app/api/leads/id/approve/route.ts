import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json().catch(() => ({}))
    const { promotorId, observacoes } = body

    // Atualizar o lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead')
      .update({ 
        status: 'APROVADO', 
        promotorId, 
        observacoes, 
        encaminhadoEm: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single()

    if (leadError) {
      console.error('Error updating lead:', leadError)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    // Criar histórico
    const { error: historyError } = await supabaseAdmin
      .from('leadHistory')
      .insert({
        leadId: id,
        actorUserId: 'system',
        fromStatus: 'EM_ANALISE',
        toStatus: 'APROVADO',
        motivo: observacoes
      })

    if (historyError) {
      console.error('Error creating history:', historyError)
    }

    return NextResponse.json({ ok: true, lead })
  } catch (error) {
    console.error('Error in approve route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}