import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { userOperations } from "@/lib/auth-data"
import { z } from "zod"

// Schema for registration validation
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

    // Check if user already exists
    const existingUser = await userOperations.findUnique({
      email: validatedData.email,
    })

    if (existingUser) {
      return NextResponse.json({ error: "Usuário já existe com este email" }, { status: 400 })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds)

    // Create user
    const user = await userOperations.create({
      nome: validatedData.nome,
      email: validatedData.email,
      hashSenha: hashedPassword,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }

    console.error("Registration error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
