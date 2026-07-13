const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    // 1. Get resellers
    const { data: resellers, error: rErr } = await supabase.from('resellers').select('*');
    if (rErr) throw rErr;
    
    if (!resellers || resellers.length === 0) {
        console.log("No resellers to migrate.");
        return;
    }
    
    // 2. Get promoters (profiles)
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, nome');
    if (pErr) throw pErr;
    const profilesMap = new Map();
    profiles.forEach(p => profilesMap.set(p.id, p.nome));
    
    for (const reseller of resellers) {
        console.log("Migrating reseller:", reseller.name);
        
        // a. Insert consultant
        const { data: consultant, error: cErr } = await supabase.from('consultant').insert({
            name: reseller.name,
            email: reseller.cpf || null, // we store CPF in email based on API
            phone: reseller.phone || null,
        }).select().single();
        if (cErr) {
             console.error("Error creating consultant for", reseller.name, cErr);
             continue;
        }
        
        const promoterName = profilesMap.get(reseller.promoter_id) || null;
        
        // b. Insert lead
        const { data: lead, error: lErr } = await supabase.from('lead').insert({
            consultant_id: consultant.id,
            status: "APROVADO",
            promoter: promoterName
        }).select().single();
        if (lErr) {
             console.error("Error creating lead for", reseller.name, lErr);
             continue;
        }
        
        // c. Insert address
        if (reseller.address || reseller.neighborhood || reseller.city || reseller.zipcode) {
             const streetJson = JSON.stringify({ rua: reseller.address || "", bairro: reseller.neighborhood || "" });
             const { error: aErr } = await supabase.from('address').insert({
                 lead_id: lead.id,
                 street: streetJson,
                 number: null,
                 city: reseller.city || null,
                 state: null,
                 zip_code: reseller.zipcode || null
             });
             if (aErr) console.error("Error creating address for", reseller.name, aErr);
        }
    }
    
    console.log("Migration complete.");
}

run();
