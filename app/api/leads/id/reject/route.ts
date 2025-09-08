import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }){
  const { id } = params
  const body = await req.json().catch(()=>({}))
  const { motivo, valorDivida, dataConsulta, observacoes } = body
  const lead = await prisma.lead.update({ where: { id }, data: { status: 'REPROVADO', motivoReprovacao: motivo, valorDivida, dataConsultaOrgaos: dataConsulta? new Date(dataConsulta): null, observacoes } })
  await prisma.leadHistory.create({ data: { leadId: id, actorUserId: 'system', fromStatus: 'EM_ANALISE', toStatus: 'REPROVADO', motivo } })
  return NextResponse.json({ ok: true, lead })
}
