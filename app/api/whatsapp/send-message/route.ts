// app/api/whatsapp/send-message/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

// Schema para validar os dados da mensagem
const sendMessageSchema = z.object({
  recipient_number: z.string().min(10, "Número do destinatário é obrigatório."),
  message_body: z.string().min(1, "A mensagem não pode estar vazia."),
  campaign_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = sendMessageSchema.parse(body);

    // ** Lógica de integração com a API do WhatsApp viria aqui **
    // Por enquanto, vamos apenas salvar no banco como "pending".

    const { data, error } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        recipient_number: validatedData.recipient_number,
        message_body: validatedData.message_body,
        campaign_id: validatedData.campaign_id,
        status: 'pending' // Status inicial
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar mensagem:', error);
      return NextResponse.json({ error: "Erro do servidor ao registrar mensagem" }, { status: 500 });
    }

    // A resposta simula um aceite da API para processamento
    return NextResponse.json({ message: "Mensagem enfileirada para envio.", data }, { status: 202 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados de entrada inválidos.", details: error.errors }, { status: 400 });
    }
    console.error("Erro na API de envio de mensagem:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}