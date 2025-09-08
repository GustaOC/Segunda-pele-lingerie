import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(){
  const data = await prisma.event.findMany({ where: { tipo: 'landing.whatsapp_click' }, orderBy: { createdAt: 'desc' }, take: 500 })
  return NextResponse.json({ data })
}
