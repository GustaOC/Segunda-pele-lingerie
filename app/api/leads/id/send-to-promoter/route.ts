import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json().catch(() => ({}))
    const canal = body.canal === 'WA' ? 'WA' : 'EMAIL'
    
    // Buscar o lead com consultant e address
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead')
      .select(`
        *,
        consultant (
          *,
          address (*)
        )
      `)
      .eq('id', id)
      .single()
    
    if (leadError || !lead) {
      console.error('Lead not found:', leadError)
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    
    // Criar notificação
    const { error: notificationError } = await supabaseAdmin
      .from('notification')
      .insert({
        type: canal,
        destinatario: lead.promotorId || 'promotor@exemplo.com',
        payload: lead,
        status: 'PENDENTE',
        leadId: lead.id
      })
    
    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in send-to-promoter route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}