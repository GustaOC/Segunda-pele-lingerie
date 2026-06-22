// app/api/whatsapp/campaigns/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

// Schema para validar os dados da nova campanha
const createCampaignSchema = z.object({
  name: z.string().min(3, "O nome da campanha é obrigatório."),
  message_template: z.string().min(10, "A mensagem é obrigatória e deve ter pelo menos 10 caracteres."),
});

// GET: Listar todas as campanhas
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar campanhas:', error);
      return NextResponse.json({ error: "Erro do servidor ao buscar campanhas" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });

  } catch (e: any) {
    console.error("Erro na API de campanhas:", e);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST: Criar uma nova campanha
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createCampaignSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('whatsapp_campaigns')
      .insert({
        name: validatedData.name,
        message_template: validatedData.message_template,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar campanha:', error);
      return NextResponse.json({ error: "Erro do servidor ao criar campanha" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados de entrada inválidos.", details: error.errors }, { status: 400 });
    }
    console.error("Erro na API de campanhas:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}