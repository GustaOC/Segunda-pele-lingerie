const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data: address, error: addressError } = await supabase
      .from('address')
      .insert({
        rua: "Rua maracaju",
        numero: "195",
        bairro: "centro",
        cidade: "Campo Grande",
        uf: "MS",
        cep: null,
      })
      .select()
      .single()

  console.log('Address:', address);
  console.log('Address Error:', addressError);
  
  if (addressError) return;

  const { data: consultant, error: consultantError } = await supabase
      .from('consultant')
      .insert({
        nome: "Bruno Teste",
        cpf: "12345678901",
        telefone: "67991389862",
        addressId: address.id
      })
      .select()
      .single()

  console.log('Consultant:', consultant);
  console.log('Consultant Error:', consultantError);

  if (consultantError) return;

  const { data: lead, error: leadError } = await supabase
      .from('lead')
      .insert({
        consultantId: consultant.id,
        status: "EM_ANALISE",
      })
      .select()
      .single()

  console.log('Lead:', lead);
  console.log('Lead Error:', leadError);
}

test();
