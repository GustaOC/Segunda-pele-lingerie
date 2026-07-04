import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, nome, cpf, telefone, endereco, emailBusca } = body;

    if (!nome || !cpf || !telefone || !endereco) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const cpfLimpo = cpf.replace(/\D/g, "");
    let targetUserId = userId;

    if (!targetUserId) {
      // Create new user since it was not linked to an existing one
      // We use a placeholder email if they didn't provide one
      const email = emailBusca || `${cpfLimpo}@cliente.local`;
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: Math.random().toString(36).slice(-10) + "A1!", // Random secure password
        email_confirm: true,
        user_metadata: {
          nome: nome,
          role: "USER",
          cpf: cpfLimpo,
          endereco: endereco
        }
      });

      if (createError) {
        console.error("Erro ao criar usuário:", createError);
        return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
      }

      targetUserId = newUser.user.id;
    } else {
      // Link to existing user: update their metadata
      const { data: existingUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        {
          user_metadata: {
            nome: nome,
            role: "USER",
            cpf: cpfLimpo,
            endereco: endereco
          }
        }
      );

      if (updateError) {
        console.error("Erro ao atualizar usuário:", updateError);
        return NextResponse.json({ error: "Erro ao vincular cliente" }, { status: 500 });
      }
    }

    // Upsert into profiles to make sure it's fully synced and searchable in the system
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: targetUserId,
      nome: nome,
      role: "USER", // Default role for clients
      telefone: telefone,
      ativo: true
    });

    if (profileError) {
      console.error("Erro ao salvar perfil:", profileError);
    }

    return NextResponse.json({ ok: true, userId: targetUserId }, { status: 201 });
  } catch (error) {
    console.error("Erro inesperado em /api/admin/clientes:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
