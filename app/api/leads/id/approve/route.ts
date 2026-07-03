import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    const body = await req.json().catch(() => ({}))
    const { promotorId, observacoes } = body

    // Atualizar o lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead')
      .update({
        status: 'APROVADO',
        promoter: promotorId,
        // The columns 'observacoes' and 'encaminhadoEm' do not exist in the database schema.
        // We omit them to avoid PGRST204 errors, since the lead was already linked.
      })
      .eq('id', id)
      .select()
      .single()

    if (leadError) {
      console.error('Error updating lead:', leadError)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, lead })
  } catch (error) {
    console.error('Error in approve route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}