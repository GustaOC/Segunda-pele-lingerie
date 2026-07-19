import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Schema de validação para novos usuários
const createUserSchema = z.object({
  nome: z.string().min(3, "Nome é obrigatório."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres."),
  role: z.enum(["ADMIN", "USER", "CONSULTANT", "TRIAGEM", "PROMOTOR", "VISUALIZADOR"]),
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

    const { data: clientesData } = await supabaseAdmin
      .from('clientes')
      .select('user_id, cpf');
    
    const clientesMap = new Map((clientesData || []).map(c => [c.user_id, c.cpf]));
    
    if (profileError) {
        console.error('Erro ao buscar perfis:', profileError);
    }

    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
    const combinedUsers: any[] = [];

    // Add all auth users
    users.users.forEach(user => {
        const profile = profilesMap.get(user.id);
        combinedUsers.push({
            id: user.id,
            email: user.email,
            nome: profile?.nome || user.user_metadata?.nome || user.user_metadata?.name || user.user_metadata?.full_name || 'Não definido',
            role: profile?.role || user.user_metadata?.role || 'USER',
            ativo: profile?.ativo ?? true,
            telefone: profile?.telefone,
            cpf: clientesMap.get(user.id),
            created_at: user.created_at,
            last_sign_in: user.last_sign_in_at,
            updated_at: profile?.updated_at || user.updated_at,
        });
        profilesMap.delete(user.id);
    });

    // Add any remaining profiles that weren't in the top 50 auth users
    profilesMap.forEach(profile => {
        combinedUsers.push({
            id: profile.id,
            email: '',
            nome: profile.nome || 'Não definido',
            role: profile.role || 'USER',
            ativo: profile.ativo ?? true,
            telefone: profile.telefone,
            cpf: clientesMap.get(profile.id),
            created_at: profile.created_at || new Date().toISOString(),
            last_sign_in: null,
            updated_at: profile.updated_at,
        });
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

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
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