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
    // Dá baixa no estoque diretamente
    for (const item of items) {
      if (!item.id || !item.color || !item.size) continue;
      
      const { data: invData } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', item.id)
        .eq('color', item.color)
        .eq('size', item.size)
        .single();
        
      if (invData && invData.quantity >= Number(item.quantity)) {
        await supabase
          .from('inventory')
          .update({ quantity: invData.quantity - Number(item.quantity) })
          .eq('id', invData.id);
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
