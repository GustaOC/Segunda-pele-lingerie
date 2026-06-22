// app/api/whatsapp/campaigns/[campaignId]/send/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;

    // Busca as mensagens pendentes da campanha
    const { data: pendingMessages, error: fetchError } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (fetchError || !pendingMessages) {
      console.error('Erro ao buscar mensagens pendentes:', fetchError);
      return NextResponse.json({ error: "Nenhuma mensagem pendente para enviar." }, { status: 404 });
    }
    
    // ** SIMULAÇÃO DE ENVIO COM DIFERENTES STATUS **
    const updates = pendingMessages.map(msg => {
        const random = Math.random();
        let status: 'sent' | 'delivered' | 'read' | 'failed' = 'sent';
        let errorMessage: string | null = null;

        if (random < 0.1) { // 10% falham
            status = 'failed';
            errorMessage = 'Número inválido';
        } else if (random < 0.3) { // 20% são lidas
            status = 'read';
        } else if (random < 0.7) { // 40% são entregues
            status = 'delivered';
        }
        // 30% permanecem como 'sent'

        return supabaseAdmin
            .from('whatsapp_messages')
            .update({ 
                status: status, 
                sent_at: new Date().toISOString(),
                delivered_at: status === 'delivered' || status === 'read' ? new Date().toISOString() : null,
                read_at: status === 'read' ? new Date().toISOString() : null,
                error_message: errorMessage
            })
            .eq('id', msg.id);
    });
    
    // Executa todas as atualizações
    await Promise.all(updates);

    // Atualiza o status da campanha principal para "sent"
    await supabaseAdmin
      .from('whatsapp_campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    return NextResponse.json({ message: "Campanha enviada com sucesso!" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro na API de envio de campanha:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}