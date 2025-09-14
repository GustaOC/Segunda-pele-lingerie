// app/api/whatsapp/campaigns/[campaignId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// GET: Buscar detalhes de uma campanha específica e suas mensagens
export async function GET(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;

    // Busca a campanha
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('whatsapp_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('Erro ao buscar campanha:', campaignError);
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    // Busca as mensagens associadas a essa campanha
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (messagesError) {
        console.error('Erro ao buscar mensagens da campanha:', messagesError);
        // Não retornamos um erro fatal, a campanha pode existir sem mensagens
    }

    return NextResponse.json({ data: { ...campaign, messages: messages || [] } }, { status: 200 });

  } catch (e: any) {
    console.error("Erro na API de detalhes da campanha:", e);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}