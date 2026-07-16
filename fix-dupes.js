require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data: fins } = await supabase.from('financial_transactions')
    .select('*')
    .like('description', '%aa0ba715%');
    
  console.log("Found financial transactions:", fins.length);
  
  // Keep the most recent one (when the kit finally successfully updated)
  fins.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const toDeleteFins = fins.slice(1);
  for (const f of toDeleteFins) {
    console.log("Deleting fin:", f.id);
    await supabase.from('financial_transactions').delete().eq('id', f.id);
  }

  // Find duplicated inventory transactions
  const { data: invs } = await supabase.from('inventory_transactions')
    .select('*')
    .like('notes', '%[Kit: aa0ba715]%');
    
  console.log("Found inventory transactions:", invs.length);
  // Group by product/size/color
  const groups = {};
  for (const inv of invs) {
    const key = `${inv.product_id}_${inv.size}_${inv.color}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(inv);
  }
  
  for (const key in groups) {
    const group = groups[key];
    if (group.length > 1) {
      group.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const toDeleteInvs = group.slice(1);
      for (const inv of toDeleteInvs) {
        console.log("Deleting duplicate inv:", inv.id);
        await supabase.from('inventory_transactions').delete().eq('id', inv.id);
        
        // Also deduct from promoter_inventory!
        const { data: pinv } = await supabase.from('promoter_inventory')
          .select('*')
          .eq('promoter_id', inv.promoter_id || 'db8d5d7d-276a-48de-b2f8-0f91285ddfbb') // promoter id
          .eq('product_id', inv.product_id)
          .eq('color', inv.color)
          .eq('size', inv.size)
          .single();
          
        if (pinv) {
          console.log("Deducting from promoter_inventory:", pinv.id, "quantity:", inv.quantity);
          await supabase.from('promoter_inventory').update({ quantity: Math.max(0, pinv.quantity - inv.quantity) }).eq('id', pinv.id);
        }
      }
    }
  }
}
fix();
