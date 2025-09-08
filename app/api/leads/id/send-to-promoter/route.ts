import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }){
  const { id } = params
  const body = await req.json().catch(()=>({}))
  const canal = body.canal==='WA'?'WA':'EMAIL'
  const lead = await prisma.lead.findUnique({ where: { id }, include: { consultant: { include: { address: true } } } })
  if(!lead) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await prisma.notification.create({ data: { type: canal as any, destinatario: lead.promotorId || 'promotor@exemplo.com', payload: lead as any, status: 'PENDENTE', leadId: lead.id } })
  return NextResponse.json({ ok: true })
}
