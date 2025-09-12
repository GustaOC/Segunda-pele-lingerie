// app/api/leads/id/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 })

    const { nomeCompleto, cpf, telefone, endereco } = body
    if (!nomeCompleto || !cpf || !telefone || !endereco) {
      return NextResponse.json({ error: "validation" }, { status: 400 })
    }

    // Verificar se o CPF já existe
    const cpfLimpo = cpf.replace(/\D/g, "")
    const { data: existingConsultant } = await supabaseAdmin
      .from('consultant')
      .select('id')
      .eq('cpf', cpfLimpo)
      .single()

    if (existingConsultant) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 })
    }

    // Criar endereço
    const { data: address, error: addressError } = await supabaseAdmin
      .from('address')
      .insert({
        rua: endereco.rua,
        numero: endereco.numero,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        uf: endereco.uf,
        cep: endereco.cep ? endereco.cep.replace(/\D/g, "") : null,
      })
      .select()
      .single()

    if (addressError) {
      console.error('Error creating address:', addressError)
      return NextResponse.json({ error: "server_error" }, { status: 500 })
    }

    // Criar consultor
    const { data: consultant, error: consultantError } = await supabaseAdmin
      .from('consultant')
      .insert({
        nome: nomeCompleto,
        cpf: cpfLimpo,
        telefone,
        addressId: address.id
      })
      .select()
      .single()

    if (consultantError) {
      console.error('Error creating consultant:', consultantError)
      return NextResponse.json({ error: "server_error" }, { status: 500 })
    }

    // Criar lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead')
      .insert({
        consultantId: consultant.id,
        status: "EM_ANALISE",
      })
      .select()
      .single()

    if (leadError) {
      console.error('Error creating lead:', leadError)
      return NextResponse.json({ error: "server_error" }, { status: 500 })
    }

    // Criar evento
    await supabaseAdmin
      .from('event')
      .insert({
        tipo: "lead.created",
        origem: "landing",
        meta: { leadId: lead.id }
      })

    return NextResponse.json({ idLead: lead.id, status: "EM_ANALISE" }, { status: 201 })
  } catch (e: any) {
    console.error("Database error:", e)
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

    console.log('🔍 Buscando leads...') // ✅ LOG PARA DEBUG

    // ✅ QUERY CORRIGIDA - usar nomes de colunas exatos do banco
    let query = supabaseAdmin
      .from('lead')
      .select(`
        *,
        consultant!inner (
          *,
          address (*)
        )
      `)

    // Aplicar filtros
    if (status) query = query.eq('status', status)
    if (promotorId) query = query.eq('promotorId', promotorId)
    
    if (from) query = query.gte('created_at', new Date(String(from)).toISOString())
    if (to) query = query.lte('created_at', new Date(String(to)).toISOString())

    // Executar query
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ data: [], error: "Database unavailable" })
    }

    console.log(`✅ Encontrados ${data?.length || 0} leads`) // ✅ LOG PARA DEBUG

    // Filtrar por cidade se necessário (pós-processamento)
    let filteredData = data || []
    if (cidade && data) {
      filteredData = data.filter(lead => 
        lead.consultant?.address?.cidade === cidade
      )
    }

    // Busca por texto
    if (q && filteredData.length > 0) {
      const cpfLimpo = q.replace(/\D/g, "")
      filteredData = filteredData.filter(lead => {
        const consultant = lead.consultant
        if (!consultant) return false
        
        return (
          consultant.nome.toLowerCase().includes(q.toLowerCase()) ||
          consultant.cpf.includes(cpfLimpo) ||
          consultant.telefone.includes(q) ||
          consultant.address?.cidade.toLowerCase().includes(q.toLowerCase())
        )
      })
    }

    console.log(`🎯 Retornando ${filteredData.length} leads filtrados`) // ✅ LOG PARA DEBUG

    return NextResponse.json({ data: filteredData })
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return NextResponse.json({ data: [], error: "Database unavailable" })
  }
}