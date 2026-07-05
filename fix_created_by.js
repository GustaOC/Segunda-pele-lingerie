const fs = require('fs');

function fixCreatedBy(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We find 'created_by: session?.user?.id' and we ensure session is available.
  // The easiest way is to find the function scope (like handleSubmit, handleFinishCart)
  // and inject `const { data: { session: currentSession } } = await supabase.auth.getSession();`
  // and use `currentSession?.user?.id` to avoid variable shadowing conflicts if `session` is already defined.

  content = content.replace(/created_by:\s*session\?.user\?.id,/g, "created_by: (await supabase.auth.getSession()).data.session?.user?.id,");

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
}

const files = [
  'app/admin/(protected)/vendas/page.tsx',
  'app/admin/(protected)/estoque/page.tsx',
  'app/admin/(protected)/estoque/promotores/page.tsx',
  'app/admin/(protected)/estoque/revendedoras/page.tsx',
];

files.forEach(fixCreatedBy);
