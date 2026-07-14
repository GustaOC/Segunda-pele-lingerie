const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRecalculate() {
    const { data: prods } = await supabase.from('products').select('id, price, category_id');
    const { data: cats } = await supabase.from('categories').select('id, name');
    
    const catMap = new Map();
    cats.forEach(c => catMap.set(c.id, c.name.toLowerCase()));
    
    const productsMap = new Map();
    prods.forEach(p => {
        const catName = p.category_id ? catMap.get(p.category_id) : '';
        const isRoupa = catName && catName.includes('roupa');
        productsMap.set(p.id, { price: p.price, isRoupa });
    });

    const { data: kits } = await supabase.from('promoter_kits')
        .select('*, items:promoter_kit_items(*)')
        .like('name', '%[FINALIZADO]%')
        .not('name', 'like', '%[ACERTADO]%');
        
    kits.forEach(k => {
        let soldNormal = 0;
        let soldRoupas = 0;
        
        k.items.forEach(item => {
            const p = productsMap.get(item.product_id);
            if (p) {
                if (p.isRoupa) soldRoupas += (item.quantity * p.price);
                else soldNormal += (item.quantity * p.price);
            }
        });
        
        const actualSold = soldNormal + soldRoupas;
        const percentSold = k.total_price > 0 ? (actualSold / k.total_price) * 100 : 0;
        
        let cp = 0;
        if (percentSold >= 100) cp = 40;
        else if (percentSold >= 70) cp = 35;
        else if (percentSold >= 30) cp = 30;
        
        const revendedoraCommission = (soldNormal * (cp / 100)) + (soldRoupas * 0.25);
        
        console.log(`Kit: ${k.name} | Total Price: ${k.total_price} | Sold: ${actualSold} | % Sold: ${percentSold.toFixed(2)}% | Comm%: ${cp}% | Rev. Comm: R$ ${revendedoraCommission.toFixed(2)}`);
    });
}
testRecalculate();
