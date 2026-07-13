const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: leads } = await supabase.from('lead').select('*').eq('status', 'APROVADO');
    if (!leads) return;
    
    for (const lead of leads) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('nome', lead.promoter).single();
        if (!profile) continue;
        
        const { data: consultant } = await supabase.from('consultant').select('*').eq('id', lead.consultant_id).single();
        if (!consultant) continue;
        
        const { data: address } = await supabase.from('address').select('*').eq('lead_id', lead.id).single();
        
        let rua = "", bairro = "";
        if (address && address.street) {
            try {
                const parsed = JSON.parse(address.street);
                rua = parsed.rua || "";
                bairro = parsed.bairro || "";
            } catch(e) {
                rua = address.street;
            }
        }
        
        const { data: existing } = await supabase.from('resellers').select('id').eq('cpf', consultant.email).single();
        if (!existing && consultant.email) {
            console.log('Inserting', consultant.name);
            await supabase.from('resellers').insert({
                promoter_id: profile.id,
                name: consultant.name,
                cpf: consultant.email,
                phone: consultant.phone,
                address: rua,
                neighborhood: bairro,
                city: address?.city,
                zipcode: address?.zip_code
            });
        }
    }
    console.log("Sync complete");
}
run();
