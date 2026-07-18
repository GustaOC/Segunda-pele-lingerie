require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const pQ = "17/07/2026 a 24/07/2026";
  const resellerId = "25258599-be24-4214-9a21-622a53265be1";

  // Using the exact code in the app
  const { data: kits, error } = await supabase
        .from('promoter_kits')
        .select('*, items:promoter_kit_items(*, products(name, sku))')
        .eq('reseller_id', resellerId)
        .is('period', pQ ? undefined : null)
  
  console.log("Error:", error);
  console.log("Kits length:", kits ? kits.length : 0);
  if (kits) {
    const filtered = kits.filter(k => k.period === pQ);
    console.log("Filtered length:", filtered.length);
  }
}
run();
