// app/api/whatsapp/campaigns/[campaignId]/send/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;

    // ** Lógica de integração real com a API do WhatsApp viria aqui **
    // Para cada mensagem, você faria uma chamada para o provedor de API.
    // Como estamos simulando, vamos apenas atualizar os status no nosso banco.

    // 1. Atualiza o status de todas as mensagens pendentes da campanha para "sent"
    const { error: messagesError } = await supabaseAdmin
      .from('whatsapp_messages')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (messagesError) {
      console.error('Erro ao atualizar mensagens:', messagesError);
      return NextResponse.json({ error: "Falha ao atualizar o status das mensagens." }, { status: 500 });
    }

    // 2. Atualiza o status da campanha principal para "sent"
    const { error: campaignError } = await supabaseAdmin
      .from('whatsapp_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (campaignError) {
        console.error('Erro ao atualizar campanha:', campaignError);
        // Mesmo que isso falhe, as mensagens foram marcadas, então não retornamos um erro fatal.
    }

    return NextResponse.json({ message: "Campanha enviada com sucesso!" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro na API de envio de campanha:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}