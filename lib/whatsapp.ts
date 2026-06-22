// lib/whatsapp.ts - Versão melhorada

import { supabaseAdmin } from "@/lib/supabase-server";

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendMessage(
  to: string,
  text: string,
  messageRecordId?: string
): Promise<WhatsAppResponse> {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !phoneNumberId) {
    console.error("ERRO CRÍTICO: Variáveis de ambiente do WhatsApp não estão configuradas.");
    return { success: false, error: "Configuração do servidor incompleta" };
  }

  const cleanNumber = to.replace(/\D/g, '');

  if (cleanNumber.length < 10) {
    console.error("ERRO: Número de telefone inválido:", to);
    return { success: false, error: "Número inválido" };
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: cleanNumber,
    type: "text",
    text: {
      body: text,
    },
  };

  try {
    console.log(`---> [ENVIO] Tentando enviar mensagem para ${cleanNumber}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("<--- [FALHA] Erro da API do WhatsApp:", responseData.error);
      return {
        success: false,
        error: responseData.error?.message || 'Erro desconhecido no envio'
      };
    }

    console.log("<--- [SUCESSO] Mensagem enviada via API:", responseData);
    return {
      success: true,
      messageId: responseData.messages[0].id
    };

  } catch (error) {
    console.error("ERRO DE REDE: Falha ao conectar com a API do WhatsApp:", error);
    return {
      success: false,
      error: "Erro de rede"
    };
  }
}