// app/api/admin/users/[userId]/toggle-status/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  try {
    const { ativo } = await req.json();

    // A lógica de ativação/desativação fica na tabela 'profiles'
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    
    // Opcional: Para desativação real, você pode "banir" o usuário.
    // Cuidado: isso é uma ação mais permanente.
    // await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: ativo ? 'none' : '365d' });

    return NextResponse.json({ message: `Status do usuário alterado para ${ativo ? 'ativo' : 'inativo'}.` });

  } catch (error: any) {
    console.error(`Erro ao alterar status do usuário ${userId}:`, error);
    return NextResponse.json({ error: "Falha ao alterar status." }, { status: 500 });
  }
}