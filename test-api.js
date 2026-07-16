require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const payload = [{
      type: "RECEIVABLE",
      description: `Teste`,
      total_value: 100,
      due_date: "2026-07-20",
      status: "NAO_PAGO",
      category: "Acertos",
      installment: "1/1"
  }];
  
  const { data, error } = await supabase.from('financial_transactions').insert(payload).select();
  console.log("Insert result:", error || data);
}
run();
