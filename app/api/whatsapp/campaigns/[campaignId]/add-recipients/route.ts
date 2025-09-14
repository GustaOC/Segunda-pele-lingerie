// app/api/whatsapp/campaigns/[campaignId]/add-recipients/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { z } from "zod";

// Schema para validar a lista de IDs dos contatos
const addRecipientsSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1, "É necessário selecionar pelo menos um contato."),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;
    const body = await req.json();
    const { contactIds } = addRecipientsSchema.parse(body);

    // 1. Buscar a campanha para obter o template da mensagem
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('whatsapp_campaigns')
      .select('message_template')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    // 2. Buscar os dados dos contatos selecionados (consultoras)
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('consultant') // Assumindo que a tabela de consultoras se chama 'consultant'
      .select('nome, telefone')
      .in('id', contactIds);

    if (contactsError || !contacts) {
      return NextResponse.json({ error: "Erro ao buscar contatos selecionados." }, { status: 500 });
    }

    // 3. Preparar as mensagens para inserção
    const messagesToInsert = contacts.map(contact => {
      // Personaliza a mensagem substituindo {nome} pelo nome do contato
      const personalizedMessage = campaign.message_template.replace(/{nome}/g, contact.nome.split(' ')[0]);

      return {
        campaign_id: campaignId,
        recipient_number: contact.telefone,
        recipient_name: contact.nome,
        message_body: personalizedMessage,
        status: 'pending' as const
      };
    });

    // 4. Inserir todas as mensagens no banco de dados
    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert(messagesToInsert);

    if (insertError) {
      console.error('Erro ao inserir mensagens:', insertError);
      return NextResponse.json({ error: "Erro ao adicionar destinatários à campanha." }, { status: 500 });
    }

    return NextResponse.json({ message: `${contacts.length} destinatários adicionados com sucesso!` }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados de entrada inválidos.", details: error.errors }, { status: 400 });
    }
    console.error("Erro na API de adicionar destinatários:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}