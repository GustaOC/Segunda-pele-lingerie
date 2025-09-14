// app/api/whatsapp/webhook/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Esta é uma rota de exemplo para simular o recebimento de webhooks do provedor de WhatsApp
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // A estrutura do corpo dependerá do provedor de API do WhatsApp
    // Exemplo simulado: { from: '5567999998888', text: 'Olá, gostaria de saber mais!' }
    const { from, text } = body;

    if (!from || !text) {
      return NextResponse.json({ error: "Dados do webhook inválidos." }, { status: 400 });
    }

    // Lógica para salvar a mensagem recebida no banco de dados
    const { error } = await supabaseAdmin
      .from('whatsapp_incoming_messages')
      .insert({
        from_number: from,
        message_body: text,
      });

    if (error) {
      console.error('Erro ao salvar mensagem recebida:', error);
      return NextResponse.json({ error: "Falha ao processar a mensagem." }, { status: 500 });
    }

    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error) {
    console.error("Erro no webhook do WhatsApp:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}