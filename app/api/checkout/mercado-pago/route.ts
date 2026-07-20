import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // ====== PAGAMENTO FANTASMA TEMPORÁRIO ======
    // Dá baixa no estoque e cria histórico de venda
    for (const item of items) {
      if (!item.id) continue;
      
      const itemColor = item.color || 'Cor Única';
      const itemSize = item.size || 'U';

      const { data: invData } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', item.id)
        .eq('color', itemColor)
        .eq('size', itemSize)
        .single();
        
      if (invData && invData.quantity >= Number(item.quantity)) {
        await supabase
          .from('inventory')
          .update({ quantity: invData.quantity - Number(item.quantity) })
          .eq('id', invData.id);
          
        // Cria o registro no histórico de vendas (PDV/Vendas)
        await supabase
          .from('transactions')
          .insert({
            product_id: item.id,
            type: 'OUT_RETAIL',
            quantity: Number(item.quantity),
            price: Number(item.unit_price || item.price),
            color: itemColor,
            size: itemSize,
            user_id: payer?.email ? null : undefined // mock simplificado
          });
      }
    }

    // Retorna direto para a tela de sucesso
    return NextResponse.json({ 
      init_point: `/sucesso`, 
      id: "PAGAMENTO-FANTASMA-TESTE" 
    }, { status: 200 });
    // ===========================================

  } catch (error: any) {
    console.error("Erro no pagamento fantasma:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar pagamento." },
      { status: 500 }
    );
  }
}
