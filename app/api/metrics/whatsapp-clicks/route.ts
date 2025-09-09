// app/api/metrics/whatsapp-clicks/route.ts
export const runtime = 'nodejs'; // garante execução em Node (server)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('event')
      .select('*')
      .eq('tipo', 'landing.whatsapp_click')
      .order('createdAt', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Supabase error (whatsapp-clicks GET):', error);
      return NextResponse.json({ data: [] }, { status: 200 }); // degrade gracefully
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error('Unexpected error (whatsapp-clicks GET):', err);
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
