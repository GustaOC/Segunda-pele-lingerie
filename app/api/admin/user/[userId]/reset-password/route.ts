// app/api/admin/users/[userId]/reset-password/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  try {
    // Busca o email do usuário para usar na função de reset
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !user) throw userError || new Error("Usuário não encontrado.");

    // Gera um link mágico para reset de senha
    const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: user.user.email!,
    });

    if (error) throw error;

    return NextResponse.json({ message: "Link de recuperação de senha enviado." });

  } catch (error: any) {
    console.error(`Erro ao resetar senha do usuário ${userId}:`, error);
    return NextResponse.json({ error: "Falha ao resetar a senha." }, { status: 500 });
  }
}