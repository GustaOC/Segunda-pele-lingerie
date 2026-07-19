import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}))
    const { motivo, observacoes } = body

    // Atualizar o lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead')
      .update({
        status: 'REPROVADO',
        // motivoReprovacao and observacoes don't exist in the database schema.
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
    console.error('Error in reject route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}