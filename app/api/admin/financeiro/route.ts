import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabase
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
    const supabase = createRouteHandlerClient({ cookies });
    
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const payload = Array.isArray(body) ? body : [body];
    
    const insertData = payload.map((b: any) => ({
      type: b.type,
      reference: b.reference || null,
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

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(insertData)
      .select();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error creating financial transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
