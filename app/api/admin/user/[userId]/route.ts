// app/api/admin/users/[userId]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

const updateUserSchema = z.object({
  nome: z.string().min(3),
  role: z.enum(["ADMIN", "USER", "CONSULTANT"]),
  telefone: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  try {
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Atualiza os metadados no Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { nome: validatedData.nome, role: validatedData.role }
    });

    if (authError) throw authError;

    // Atualiza a tabela de profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nome: validatedData.nome,
        role: validatedData.role,
        updated_at: new Date().toISOString(),
        // O campo 'telefone' foi removido temporariamente para evitar o erro
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    return NextResponse.json({ message: "Usuário atualizado com sucesso." });

  } catch (error: any) {
    console.error(`Erro ao atualizar usuário ${userId}:`, error);
    return NextResponse.json({ error: "Falha ao atualizar usuário." }, { status: 500 });
  }
}