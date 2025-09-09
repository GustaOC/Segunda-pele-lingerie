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
        cep: endereco.cep.replace(/\D/g, ""),
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

    // Construir query
    let query = supabaseAdmin
      .from('lead')
      .select(`
        *,
        consultant (
          *,
          address (*)
        )
      `)

    // Aplicar filtros
    if (status) query = query.eq('status', status)
    if (promotorId) query = query.eq('promotorId', promotorId)
    
    if (from) query = query.gte('createdAt', new Date(String(from)).toISOString())
    if (to) query = query.lte('createdAt', new Date(String(to)).toISOString())

    // Filtro de cidade (precisa de join)
    if (cidade) {
      // Como Supabase não suporta filtros em relações aninhadas facilmente,
      // você pode precisar fazer uma query separada ou ajustar a estrutura
      // Por enquanto, vamos buscar todos e filtrar no código
    }

    // Busca por texto
    if (q) {
      const cpfLimpo = q.replace(/\D/g, "")
      query = query.or(`consultant.nome.ilike.%${q}%,consultant.cpf.eq.${cpfLimpo},consultant.telefone.eq.${q}`)
    }

    // Executar query
    const { data, error } = await query
      .order('createdAt', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ data: [], error: "Database unavailable" })
    }

    // Filtrar por cidade se necessário (pós-processamento)
    let filteredData = data || []
    if (cidade && data) {
      filteredData = data.filter(lead => 
        lead.consultant?.address?.cidade === cidade
      )
    }

    return NextResponse.json({ data: filteredData })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ data: [], error: "Database unavailable" })
  }
}