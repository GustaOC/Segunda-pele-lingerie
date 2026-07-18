const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await supabase.from('promoter_kits').select('id, name, period, promoter_id, reseller_id');
  console.log(data?.slice(0, 5));
  const nullPromoters = data?.filter(k => !k.promoter_id);
  console.log("Kits with null promoter_id:", nullPromoters?.length);
})();
