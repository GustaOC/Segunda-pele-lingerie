// app/api/events/route.ts
export const runtime = 'nodejs';
import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { tipo = 'landing.whatsapp_click', origem = 'landing', meta = {} } = body;

    const { data, error } = await supabaseAdmin
      .from('event')
      .insert([{ tipo, origem, meta }])
      .select() // retorna o registro criado
      .limit(1);

    if (error) {
      console.error('Supabase error (events POST):', error);
      return NextResponse.json({ ok: true, warning: 'Database unavailable' });
    }

    return NextResponse.json({ ok: true, event: data?.[0] ?? null });
  } catch (error) {
    console.error('Database error (events POST):', error);
    return NextResponse.json({ ok: true, warning: 'Database unavailable' });
  }
}
