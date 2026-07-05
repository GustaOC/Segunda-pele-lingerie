const fs = require('fs');

const path = 'app/admin/(protected)/estoque/historico/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the creator:created_by from the query
content = content.replace(
  /,\s*creator:created_by \(\s*nome\s*\)/,
  ""
);

// 2. Add profilesMap fetching right after the select
const replacement2 = `
      if (error) throw error

      const { data: allProfiles } = await supabase.from('profiles').select('id, nome')
      const pMap = new Map(allProfiles?.map(p => [p.id, p.nome]) || [])
      
      const transactionsWithCreator = (data || []).map(t => ({
        ...t,
        creatorName: pMap.get(t.created_by)
      }))

      setTransactions(transactionsWithCreator)
`;
content = content.replace(
  /\n      if \(error\) throw error\n\n      setTransactions\(data \|\| \[\]\)/,
  replacement2
);

// 3. Update the td to use creatorName
const oldTd = `{t.creator ? t.creator.nome : <span className="text-slate-400 font-normal italic">Sistema</span>}`;
const newTd = `{t.creatorName ? t.creatorName : (t.created_by ? 'Desconhecido' : <span className="text-slate-400 font-normal italic">Sistema</span>)}`;
content = content.replace(oldTd, newTd);

fs.writeFileSync(path, content);
console.log('Fixed history page fetch');
