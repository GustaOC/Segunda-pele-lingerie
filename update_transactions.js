const fs = require('fs');

function addCreatedBy(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We need to find all supabase.from('inventory_transactions').insert({ ... })
  // and inject created_by: session?.user?.id || session?.id (depending on how session is structured)

  // First, check if session is retrieved in the component. If not, we might need to add it, 
  // but most of these files already do getSession().
  
  // A simple regex to add created_by to the insert object
  // Find: supabase.from('inventory_transactions').insert({
  // Replace: supabase.from('inventory_transactions').insert({\ncreated_by: session?.user?.id,

  content = content.replace(/supabase\.from\('inventory_transactions'\)\.insert\(\{/g, "supabase.from('inventory_transactions').insert({\ncreated_by: session?.user?.id,");
  
  // also check if they use an array insert: .insert([{
  content = content.replace(/supabase\.from\('inventory_transactions'\)\.insert\(\[\{/g, "supabase.from('inventory_transactions').insert([{\ncreated_by: session?.user?.id,");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

const files = [
  'app/admin/(protected)/vendas/page.tsx',
  'app/admin/(protected)/estoque/page.tsx',
  'app/admin/(protected)/estoque/promotores/page.tsx',
  'app/admin/(protected)/estoque/revendedoras/page.tsx',
];

files.forEach(addCreatedBy);
