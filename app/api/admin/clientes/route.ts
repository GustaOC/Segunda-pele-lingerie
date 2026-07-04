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
      const email = emailBusca || `${cpfLimpo}@cliente.local`;
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: Math.random().toString(36).slice(-10) + "A1!", 
        email_confirm: true,
        user_metadata: {
          nome: nome,
          role: "USER"
        }
      });

      if (createError) {
        console.error("Erro ao criar usuário:", createError);
        return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
      }

      targetUserId = newUser.user.id;
    } else {
      // Update existing auth user just in case
      await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        {
          user_metadata: {
            nome: nome,
            role: "USER"
          }
        }
      );
    }

    // Upsert into profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: targetUserId,
      nome: nome,
      role: "USER", 
      telefone: telefone,
      ativo: true
    });

    if (profileError) {
      console.error("Erro ao salvar perfil:", profileError);
    }

    // Upsert into the new clientes table
    const { error: clienteError } = await supabaseAdmin.from('clientes').upsert({
      user_id: targetUserId,
      cpf: cpfLimpo,
      rua: endereco.rua,
      numero: endereco.numero,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
      cep: endereco.cep
    });

    if (clienteError) {
      console.error("Erro ao salvar dados na tabela clientes:", clienteError);
      return NextResponse.json({ error: "Erro ao salvar os detalhes do cliente" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId: targetUserId }, { status: 201 });
  } catch (error) {
    console.error("Erro inesperado em /api/admin/clientes:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
