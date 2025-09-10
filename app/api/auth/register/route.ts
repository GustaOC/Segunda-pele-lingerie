import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { userOperations } from "@/lib/supabase-auth"
import { z } from "zod"

const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["ADMIN", "TRIAGEM", "PROMOTOR"]).default("ADMIN"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Verificar se usuário já existe
    const existingUser = await userOperations.findUnique({
      email: validatedData.email,
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já existe com este email" }, 
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Criar usuário
    const user = await userOperations.create({
      nome: validatedData.nome,
      email: validatedData.email,
      password: hashedPassword, // ← Campo correto
      role: validatedData.role,
      ativo: true,
    })

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        ativo: user.ativo,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors }, 
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erro ao criar usuário. Verifique os logs." }, 
      { status: 500 }
    )
  }
}