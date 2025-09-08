import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 })

    const { nomeCompleto, cpf, telefone, endereco } = body
    if (!nomeCompleto || !cpf || !telefone || !endereco) {
      return NextResponse.json({ error: "validation" }, { status: 400 })
    }

    const consultant = await prisma.consultant.create({
      data: {
        nome: nomeCompleto,
        cpf: cpf.replace(/\D/g, ""),
        telefone,
        address: {
          create: {
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            uf: endereco.uf,
            cep: endereco.cep.replace(/\D/g, ""),
          },
        },
      },
    })

    const lead = await prisma.lead.create({
      data: {
        consultantId: consultant.id,
        status: "EM_ANALISE",
      },
    })

    await prisma.event.create({
      data: {
        tipo: "lead.created",
        origem: "landing",
        meta: { leadId: lead.id } as any,
      },
    })

    return NextResponse.json({ idLead: lead.id, status: "EM_ANALISE" }, { status: 201 })
  } catch (e: any) {
    console.error("Database error:", e)
    if (String(e.message).includes("Unique")) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 })
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || undefined
    const cidade = searchParams.get("cidade") || undefined
    const promotorId = searchParams.get("promotorId") || undefined
    const q = searchParams.get("q") || undefined
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: any = {}
    if (status) where.status = status
    if (promotorId) where.promotorId = promotorId
    if (from || to)
      where.createdAt = {
        gte: from ? new Date(String(from)) : undefined,
        lte: to ? new Date(String(to)) : undefined,
      }
    if (cidade) where.consultant = { address: { is: { cidade } } }
    if (q)
      where.OR = [
        { consultant: { nome: { contains: q, mode: "insensitive" } } },
        { consultant: { cpf: q.replace(/\D/g, "") } },
        { consultant: { telefone: q } },
      ]

    const data = await prisma.lead.findMany({
      where,
      include: { consultant: { include: { address: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ data: [], error: "Database unavailable" })
  }
}
