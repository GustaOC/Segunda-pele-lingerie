// app/api/leads/id/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }){
  const { id } = params
  const body = await req.json().catch(()=>({}))
  const { promotorId, observacoes } = body
  const lead = await prisma.lead.update({ where: { id }, data: { status: 'APROVADO', promotorId, observacoes, encaminhadoEm: new Date() } })
  await prisma.leadHistory.create({ data: { leadId: id, actorUserId: 'system', fromStatus: 'EM_ANALISE', toStatus: 'APROVADO', motivo: observacoes } })
  return NextResponse.json({ ok: true, lead })
}
