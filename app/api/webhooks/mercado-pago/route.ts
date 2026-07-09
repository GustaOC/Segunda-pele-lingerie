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

      // Metadados passados na criação da preferência
      const metadata = paymentData.metadata;

      if (paymentData.status === "approved") {
        // Exemplo: Atualizar a tabela de pedidos
        if (metadata && metadata.user_id) {
           // O usuário precisará criar a tabela orders conforme o sql_orders.md
           // const { error } = await supabase.from('orders').update({ status: 'approved', payment_id: paymentData.id }).eq('user_id', metadata.user_id).eq('status', 'pending');
           console.log(`Pagamento ${paymentData.id} aprovado para usuário ${metadata.user_id}. Atualize o banco!`);
           
           // Em uma aplicação real, aqui você também chamaria a API para limpar o carrinho do usuário
           // e subtrair o estoque.
        }
      } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
        if (metadata && metadata.user_id) {
            // const { error } = await supabase.from('orders').update({ status: 'rejected' }).eq('user_id', metadata.user_id);
            console.log(`Pagamento ${paymentData.id} rejeitado.`);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro no Webhook Mercado Pago:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
