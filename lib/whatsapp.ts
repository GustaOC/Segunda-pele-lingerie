// lib/whatsapp.ts

export async function sendMessage(to: string, text: string): Promise<boolean> {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !phoneNumberId) {
    console.error("Variáveis de ambiente do WhatsApp não estão configuradas.");
    return false;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: {
      body: text,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro ao enviar mensagem pelo WhatsApp:", errorData);
      return false;
    }

    const responseData = await response.json();
    console.log("Mensagem enviada com sucesso:", responseData);
    return true;

  } catch (error) {
    console.error("Erro de rede ao enviar mensagem:", error);
    return false;
  }
}