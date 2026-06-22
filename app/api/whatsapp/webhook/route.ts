// app/api/whatsapp/webhook/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendMessage } from "@/lib/whatsapp";
import OpenAI from "openai";

// Rota para verificação do Webhook (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Falha na verificação do Webhook.');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// Rota para receber notificações de mensagens (POST)
export async function POST(req: NextRequest) {
  try {
    // CORRIGIDO: Verificação da chave movida para dentro da função POST
    if (!process.env.OPENAI_API_KEY) {
      console.error("A variável de ambiente OPENAI_API_KEY não está definida.");
      return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
    }
    
    // CORRIGIDO: Cliente da OpenAI inicializado dentro da função POST
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

                // Salva a mensagem recebida no banco de dados
                await supabaseAdmin.from('whatsapp_incoming_messages').insert({
                  from_number: userPhoneNumber,
                  message_body: userMessage,
                });

                // =================================================================
                // INÍCIO: INSTRUÇÕES E BASE DE CONHECIMENTO PARA A IA
                // =================================================================
                const knowledgeBase = `
                  - Horário de funcionamento: Nosso atendimento funciona de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 15h.
                  - Endereço da loja: Nossa loja fica na Rua 14 de Julho, 2487.
                  - Como se tornar uma revendedora: Para ser revendedora, é preciso preencher o formulário em nosso site com os dados. O link é: www.segundapelelingeire.com
                  - Comissão de revenda: A comissão varia de 30% a 40%, dependendo do volume de vendas. Vendas abaixo de R$250 não recebem comissão.
                  - Sistema de consignação: Sim, todos os produtos são em consignação. A revendedora paga apenas o que vender e devolve o restante.
                  - Prazo para revenda: O prazo é de 45 dias para a capital e 60 dias para o interior.
                `;

                const systemPrompt = `
                  Você é a "Pele", a assistente virtual da Segunda Pele Lingerie, uma marca de lingerie líder em Mato Grosso do Sul. Seu tom é amigável, prestativo e um pouco informal.

                  Sua principal função é responder a perguntas de clientes e potenciais revendedoras com base nas informações abaixo. Use SOMENTE estas informações para formular suas respostas. Seja concisa e direta.

                  Base de Conhecimento:
                  ${knowledgeBase}
                `;
                // =================================================================
                // FIM: INSTRUÇÕES E BASE DE CONHECIMENTO PARA A IA
                // =================================================================

                console.log("--> Consultando a IA com base no conhecimento fornecido...");
                const completion = await openai.chat.completions.create({
                  model: "gpt-4o",
                  messages: [
                    { role: "system", content: systemPrompt },
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