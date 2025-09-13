// app/api/admin/users/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

// Schema de validação para novos usuários
const createUserSchema = z.object({
  nome: z.string().min(3, "Nome é obrigatório."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres."),
  role: z.enum(["ADMIN", "USER", "CONSULTANT"]),
  telefone: z.string().optional(),
});

// GET: Listar todos os usuários do sistema
export async function GET(req: NextRequest) {
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Erro ao listar usuários:', error);
      return NextResponse.json({ error: "Falha ao buscar usuários." }, { status: 500 });
    }

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*');
    
    if (profileError) {
        console.error('Erro ao buscar perfis:', profileError);
    }

    const combinedUsers = users.users.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        return {
            id: user.id,
            email: user.email,
            nome: profile?.nome || user.user_metadata?.nome || 'Não definido',
            role: profile?.role || 'USER',
            ativo: profile?.ativo ?? true,
            telefone: profile?.telefone,
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at,
            updated_at: profile?.updated_at || user.updated_at,
        };
    });

    return NextResponse.json({ data: combinedUsers });

  } catch (error) {
    console.error("Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

// POST: Criar um novo usuário
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);

    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
      user_metadata: {
        nome: validatedData.nome,
        role: validatedData.role,
      },
    });

    if (error) {
      console.error('Erro ao criar usuário no Supabase Auth:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: newUser.user.id,
        nome: validatedData.nome,
        role: validatedData.role,
        ativo: true,
        // O campo 'telefone' foi removido temporariamente para evitar o erro
    });

    if (profileError) {
        console.error('Erro ao criar perfil do usuário:', profileError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return NextResponse.json({ error: "Falha ao criar perfil do usuário." }, { status: 500 });
    }

    return NextResponse.json({ data: newUser.user }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Erro inesperado:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}