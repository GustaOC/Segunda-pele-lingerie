import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.name || !body.phone) {
      return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('promoters')
      .insert({ name: body.name, phone: body.phone })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar promotor:', error);
      return NextResponse.json({ error: "Erro do servidor ao criar promotor" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });

  } catch (e: any) {
    console.error("Erro na API de promotores:", e);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
      const { data, error } = await supabaseAdmin
        .from('promoters')
        .select('*')
        .order('name', { ascending: true });
  
      if (error) {
        console.error('Erro ao buscar promotores:', error);
        return NextResponse.json({ data: [], error: "Erro ao buscar dados" }, {status: 500});
      }
  
      return NextResponse.json({ data: data || [] });
    } catch (error) {
      console.error("Erro inesperado na API de promotores:", error);
      return NextResponse.json({ data: [], error: "Erro interno do servidor" }, {status: 500});
    }
  }