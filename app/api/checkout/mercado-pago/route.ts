import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

// Inicializa o cliente do Mercado Pago com o Access Token
const accessToken = process.env.MP_ACCESS_TOKEN || "TEST-8730999516641619-070802-dc90e6a8e52e4fb803d35ef2e4df8e1c-164478796";
const client = new MercadoPagoConfig({ accessToken });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, payer, shippingCost, metadata } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    const userId = metadata?.user_id || payer?.email || "anonymous";

    // Calcular total
    let total = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) * Number(item.unit_price || item.price)), 0);
    if (shippingCost) total += shippingCost;

    // Criar o pedido na tabela orders como "pending"
    const { data: orderData, error: orderError } = await supabase.from('orders').insert({
      user_id: metadata?.user_id || null,
      status: 'pending',
      total: total,
    }).select('id').single();

    if (orderError) {
      console.error("Erro ao criar pedido:", orderError);
      return NextResponse.json({ error: "Erro interno ao criar pedido" }, { status: 500 });
    }

    const orderId = orderData.id;

    // Inserir os itens na tabela order_items
    const orderItemsToInsert = items.map((item: any) => ({
      order_id: orderId,
      product_id: item.id,
      quantity: Number(item.quantity),
      size: item.size || 'U',
      color: item.color || null,
      price_at_time: Number(item.unit_price || item.price)
    }));

    await supabase.from('order_items').insert(orderItemsToInsert);

    // Preparar os metadados para o Mercado Pago
    const enrichedMetadata = {
      ...metadata,
      order_id: orderId
    };

    // Criar preferência no Mercado Pago
    const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price || item.price)
        })),
        payer: {
          email: payer?.email || "teste@teste.com",
          name: payer?.name || "Teste",
        },
        back_urls: {
          success: `${host}/sucesso`,
          failure: `${host}/checkout`,
          pending: `${host}/checkout`
        },
        auto_return: "approved",
        metadata: enrichedMetadata, // Contém o order_id para o webhook processar
      }
    });

    return NextResponse.json({ 
      init_point: result.init_point, 
      id: result.id 
    }, { status: 200 });
  } catch (error) {
    console.error("Erro na API Mercado Pago:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
