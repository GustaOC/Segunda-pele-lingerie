import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

const accessToken = process.env.MP_ACCESS_TOKEN || "TEST-8730999516641619-070802-dc90e6a8e52e4fb803d35ef2e4df8e1c-164478796";
const client = new MercadoPagoConfig({ accessToken });

// Admin client para bypass RLS no webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || searchParams.get("topic");
    const dataId = searchParams.get("data.id") || searchParams.get("id");

    if (type === "payment" && dataId) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: dataId });

      console.log("Recebido Webhook MP Pagamento:", paymentData.id, "Status:", paymentData.status);

      const metadata = paymentData.metadata;

      if (paymentData.status === "approved" && metadata && metadata.order_id) {
        // Verifica se o pedido já foi processado (para evitar duplicidade em retentativas do webhook)
        const { data: order } = await supabase.from('orders').select('status, user_id').eq('id', metadata.order_id).single();
        
        if (order && order.status === 'pending') {
          // 1. Atualizar o pedido para aprovado
          await supabase.from('orders').update({ status: 'approved', payment_id: paymentData.id.toString() }).eq('id', metadata.order_id);
          
          // 2. Dar baixa no estoque
          const { data: orderItems } = await supabase.from('order_items').select('*').eq('order_id', metadata.order_id);
          
          if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
              const itemColor = item.color || 'Cor Única';
              const itemSize = item.size || 'U';

              // Busca inventário
              const { data: invData } = await supabase
                .from('inventory')
                .select('id, quantity, color')
                .eq('product_id', item.product_id)
                .eq('color', itemColor)
                .eq('size', itemSize)
                .single();
                
              if (invData) {
                // Desconta do inventário atual
                await supabase
                  .from('inventory')
                  .update({ quantity: invData.quantity - Number(item.quantity) })
                  .eq('id', invData.id);
                  
                // Registra transação financeira (Vendas)
                await supabase
                  .from('transactions')
                  .insert({
                    product_id: item.product_id,
                    type: 'OUT_RETAIL',
                    quantity: Number(item.quantity),
                    price: Number(item.price_at_time),
                    color: itemColor,
                    size: itemSize,
                    user_id: order.user_id
                  });
                  
                // Registra transação de estoque geral
                await supabase
                  .from('inventory_transactions')
                  .insert({
                    product_id: item.product_id,
                    type: 'OUT_RETAIL',
                    quantity: -Number(item.quantity), // negativo porque é saída
                    color: itemColor,
                    size: itemSize,
                    notes: 'Venda Ecommerce (Pedido ' + metadata.order_id.split('-')[0] + ')'
                  });
              }
            }
          }
          
          // 3. Limpar o carrinho do usuário
          if (order.user_id) {
            await supabase.from('cart_items').delete().eq('user_id', order.user_id);
          }
          
          console.log(`Pedido ${metadata.order_id} processado com sucesso!`);
        }
      } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
        if (metadata && metadata.order_id) {
            await supabase.from('orders').update({ status: 'rejected', payment_id: paymentData.id.toString() }).eq('id', metadata.order_id);
            console.log(`Pedido ${metadata.order_id} rejeitado.`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro no Webhook Mercado Pago:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
