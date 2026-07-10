import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Auto set payment_date if status is QUITADO
    if (body.status === 'QUITADO' && !body.payment_date) {
      body.payment_date = new Date().toISOString().split('T')[0];
      body.paid_value = body.total_value; // Assuming full payment if not specified
    }

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      await supabaseAdmin.from('financial_history').insert([{
        transaction_id: data.id,
        user_name: 'Usuário Admin',
        action: body.status === 'QUITADO' ? 'QUITOU CONTA' : 'ATUALIZOU CONTA',
        details: body.status === 'QUITADO' ? `Marcou como quitado - Valor Pago: R$ ${data.paid_value}` : `Atualizou os dados da conta.`
      }]);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating financial transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: tx } = await supabaseAdmin.from('financial_transactions').select('description, reference').eq('id', params.id).single();

    const { error } = await supabaseAdmin
      .from('financial_transactions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    if (tx) {
      await supabaseAdmin.from('financial_history').insert([{
        transaction_id: null,
        user_name: 'Usuário Admin',
        action: 'EXCLUIU CONTA',
        details: `Excluiu conta permanentemente. Descrição: ${tx.description} - Ref: ${tx.reference || 'N/A'}`
      }]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting financial transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
