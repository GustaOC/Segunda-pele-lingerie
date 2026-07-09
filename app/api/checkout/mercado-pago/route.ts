import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializa o cliente do Mercado Pago com o Access Token
// Usamos um token de ambiente ou um fallback vazio se não houver nas envs
const accessToken = process.env.MP_ACCESS_TOKEN || "TEST-8730999516641619-070802-dc90e6a8e52e4fb803d35ef2e4df8e1c-164478796"; // Chave de teste pública aleatória como fallback seguro para dev
const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, payer, shippingCost, metadata } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // Criar a preferência
    const preference = new Preference(client);

    // Mapear os itens para o formato do MP
    const mpItems = items.map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price || item.price),
      currency_id: "BRL",
      description: `Tamanho: ${item.size} | Cor: ${item.color}`,
    }));

    // Se houver custo de frete, adiciona como um item na preferência
    if (shippingCost > 0) {
      mpItems.push({
        id: "FRETE",
        title: "Frete / Entrega",
        quantity: 1,
        unit_price: Number(shippingCost),
        currency_id: "BRL",
      });
    }

    const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const response = await preference.create({
      body: {
        items: mpItems,
        payer: {
          email: payer?.email || "test_user@testuser.com",
          name: payer?.name || "Cliente",
          // document_type e document_number podem ser adicionados se coletados no front
        },
        back_urls: {
          success: `${host}/sucesso`,
          pending: `${host}/sucesso?status=pending`,
          failure: `${host}/checkout?error=failed`,
        },
        auto_return: "approved",
        metadata: metadata, // Pode passar o ID do pedido no banco de dados
      },
    });

    // Retorna a URL do init_point (Checkout Pro)
    return NextResponse.json({ 
      init_point: response.init_point, 
      id: response.id 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao criar preferência MP:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar pagamento." },
      { status: 500 }
    );
  }
}
