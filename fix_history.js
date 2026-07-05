const fs = require('fs');

const path = 'app/admin/(protected)/estoque/historico/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update select query to include creator:created_by(nome)
content = content.replace(
  /profiles:promoter_id \(\s*id,\s*nome\s*\)/,
  "profiles:promoter_id (\n            id,\n            nome\n          ),\n          creator:created_by (\n            nome\n          )"
);

// Add table header for Responsável
content = content.replace(
  /<th className="px-6 py-4">Envolvido \/ Notas<\/th>/,
  '<th className="px-6 py-4">Responsável</th>\n                    <th className="px-6 py-4">Envolvido / Notas</th>'
);

// Add table cell for Responsável
// Find <td className="px-6 py-4">\n                          {t.profiles && (
// And replace it with a new td for Responsável, then the existing td
content = content.replace(
  /<td className="px-6 py-4">\s*\{t\.profiles && \(/,
  `<td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {t.creator ? t.creator.nome : <span className="text-slate-400 font-normal italic">Sistema</span>}
                        </td>
                        <td className="px-6 py-4">
                          {t.profiles && (`
);

fs.writeFileSync(path, content);
console.log('Fixed history page');
