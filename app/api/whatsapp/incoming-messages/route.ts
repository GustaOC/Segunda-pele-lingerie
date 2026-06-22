// app/api/whatsapp/incoming-messages/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    // No futuro, você pode adicionar filtros por campanha (campaignId)
    // const { searchParams } = new URL(req.url);
    // const campaignId = searchParams.get("campaignId");

    const { data, error } = await supabaseAdmin
      .from('whatsapp_incoming_messages')
      .select('*')
      .order('received_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar mensagens recebidas:', error);
      return NextResponse.json({ error: "Erro do servidor" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (e: any) {
    console.error("Erro na API de mensagens recebidas:", e);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}