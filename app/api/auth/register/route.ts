// app/api/auth/register/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["ADMIN", "TRIAGEM", "PROMOTOR"]).default("ADMIN"),
});

export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignora o erro se os cabeçalhos já foram enviados.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Ignora o erro se os cabeçalhos já foram enviados.
          }
        },
      },
    }
  );

  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          nome: validatedData.nome,
          role: validatedData.role,
        },
      },
    });

    if (error) {
      console.error("Erro ao registrar no Supabase:", error);
      if (error.message.includes("User already registered")) {
        return NextResponse.json(
          { error: "Já existe um usuário com este email." },
          { status: 409 }
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

    return NextResponse.json({
      message: "Usuário criado com sucesso! Verifique seu email para confirmação, se aplicável.",
      user: data.user,
    });

  } catch (error) {
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