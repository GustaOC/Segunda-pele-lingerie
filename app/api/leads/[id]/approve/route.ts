import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Unificação: Ao aprovar, inserir também na tabela 'resellers' que é usada pelas telas de Estoque e Acertos
    if (lead && lead.consultant_id) {
      try {
        // 1. Obter UUID do promotor pelo nome
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('nome', promotorId)
          .single();
          
        if (profile) {
          // 2. Obter dados do revendedor
          const { data: consultant } = await supabaseAdmin
            .from('consultant')
            .select('*')
            .eq('id', lead.consultant_id)
            .single();
            
          // 3. Obter endereço
          const { data: address } = await supabaseAdmin
            .from('address')
            .select('*')
            .eq('lead_id', lead.id)
            .single();
            
          if (consultant) {
            let rua = "", bairro = "";
            if (address && address.street) {
                try {
                    const parsed = JSON.parse(address.street);
                    rua = parsed.rua || "";
                    bairro = parsed.bairro || "";
                } catch(e) {
                    rua = address.street;
                }
            }
            
            // Verificar se já existe na tabela resellers para evitar duplicação (pelo CPF que tá no email)
            const { data: existing } = await supabaseAdmin
              .from('resellers')
              .select('id')
              .eq('cpf', consultant.email)
              .single();
              
            if (!existing) {
                await supabaseAdmin.from('resellers').insert({
                    promoter_id: profile.id,
                    name: consultant.name,
                    cpf: consultant.email, // CPF was saved in email field
                    phone: consultant.phone,
                    address: rua,
                    neighborhood: bairro,
                    city: address?.city,
                    zipcode: address?.zip_code
                });
            }
          }
        }
      } catch (err) {
        console.error('Erro ao replicar lead para resellers:', err);
        // Não falhamos o fluxo se a replicação falhar
      }
    }

    return NextResponse.json({ ok: true, lead })
  } catch (error) {
    console.error('Error in approve route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}