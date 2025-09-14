// app/api/whatsapp/webhook/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendMessage } from "@/lib/whatsapp";
import OpenAI from "openai";

// Inicializa o cliente da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rota para verificação do Webhook (GET) - ESTA É A PARTE QUE FALTAVA
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verifica se o token e o modo estão presentes e corretos
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Falha na verificação do Webhook. Verifique se o WHATSAPP_VERIFY_TOKEN está correto no seu ficheiro .env');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Rota para receber notificações de mensagens (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              if (message.from === process.env.WHATSAPP_PHONE_NUMBER_ID?.replace(/\D/g, '')) {
                  continue;
              }
              
              if (message.type === 'text') {
                const userMessage = message.text.body;
                const userPhoneNumber = message.from;

                await supabaseAdmin.from('whatsapp_incoming_messages').insert({
                  from_number: userPhoneNumber,
                  message_body: userMessage,
                });

                const completion = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [
                    { 
                      role: "system", 
                      content: `Você é a "Pele", a assistente virtual da Segunda Pele Lingerie, uma marca de lingerie líder em Mato Grosso do Sul. Seu tom é amigável, prestativo e um pouco informal. Você ajuda consultoras com dúvidas sobre produtos, pedidos, promoções e o processo de se tornar uma revendedora. Responda de forma concisa e útil.`
                    },
                    { role: "user", content: userMessage }
                  ],
                });

                const aiResponse = completion.choices[0].message.content;

                if (aiResponse) {
                  await sendMessage(userPhoneNumber, aiResponse);
                }
              }
            }
          }
        }
      }
    }
    
    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error) {
    console.error("Erro no webhook do WhatsApp com IA:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}