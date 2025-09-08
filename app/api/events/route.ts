import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { tipo = "landing.whatsapp_click" } = body

    await prisma.event.create({
      data: {
        tipo,
        origem: "landing",
        meta: {} as any,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Database error:", error)
    // Return success even if database fails to prevent deployment issues
    return NextResponse.json({ ok: true, warning: "Database unavailable" })
  }
}
