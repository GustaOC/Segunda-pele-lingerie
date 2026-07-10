import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('financial_transactions')
      .select('*')
      .order('due_date', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching financial transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const payload = Array.isArray(body) ? body : [body];
    
    // Obter referência base caso esteja vazia
    let baseReference = payload[0].reference || "";
    if (!baseReference) {
      const { data: refId, error: refError } = await supabaseAdmin.rpc('get_next_financial_ref');
      if (!refError && refId) {
        baseReference = refId.toString();
      }
    }
    
    const insertData = payload.map((b: any) => ({
      type: b.type,
      reference: b.reference || baseReference || null,
      description: b.description,
      invoice: b.invoice || null,
      total_value: b.total_value,
      paid_value: b.paid_value || 0,
      installment: b.installment || '1/1',
      due_date: b.due_date,
      payment_date: b.payment_date || null,
      status: b.status || 'NAO_PAGO',
      payment_method: b.payment_method || null,
      category: b.category || null
    }));

    const { data, error } = await supabaseAdmin
      .from('financial_transactions')
      .insert(insertData)
      .select();

    if (error) throw error;

    // Inserir logs de histórico
    if (data && data.length > 0) {
      const historyLogs = data.map((t: any) => ({
        transaction_id: t.id,
        user_name: 'Usuário Admin', // Aqui poderia vir o usuário logado futuramente
        action: 'CRIOU CONTA',
        details: `Criou conta a ${t.type === 'PAYABLE' ? 'pagar' : 'receber'} - Ref: ${t.reference} - Valor: R$ ${t.total_value}`
      }));
      
      await supabaseAdmin.from('financial_history').insert(historyLogs);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error creating financial transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
