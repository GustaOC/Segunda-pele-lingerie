// app/api/auth/register/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

// Schema de validação para os dados do formulário
const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["ADMIN", "TRIAGEM", "PROMOTOR"]).default("ADMIN"),
});

export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  // Cria um cliente Supabase para ser usado no servidor
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Usa a função nativa do Supabase para criar um novo usuário
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        // Armazena dados extras (como nome e role) nos metadados do usuário
        data: {
          nome: validatedData.nome,
          role: validatedData.role,
        },
      },
    });

    if (error) {
      console.error("Erro ao registrar no Supabase:", error);
      // Retorna um erro mais específico se o usuário já existir
      if (error.message.includes("User already registered")) {
        return NextResponse.json(
          { error: "Já existe um usuário com este email." },
          { status: 409 } // Status "Conflict"
        );
      }
      return NextResponse.json(
        { error: "Não foi possível criar o usuário.", details: error.message },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Usuário não foi criado, mas não houve um erro explícito." },
        { status: 500 }
      );
    }

    // Retorna uma resposta de sucesso
    return NextResponse.json({
      message: "Usuário criado com sucesso! Por padrão, o Supabase pode exigir confirmação por e-mail.",
      user: data.user,
    });

  } catch (error) {
    // Trata erros de validação do Zod ou outros erros inesperados
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados de entrada inválidos.", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro inesperado na rota de registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}