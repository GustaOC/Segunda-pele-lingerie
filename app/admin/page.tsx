export default function Admin(){
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <input className="border rounded-2xl px-3 py-2" placeholder="Buscar por nome/CPF/telefone" />
          <select className="border rounded-2xl px-3 py-2"><option>Status</option><option>EM_ANALISE</option><option>APROVADO</option><option>REPROVADO</option></select>
          <select className="border rounded-2xl px-3 py-2"><option>Cidade</option></select>
        </div>
      </header>
      <section className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow">Cadastros hoje <b>12</b></div>
        <div className="bg-white rounded-2xl p-4 shadow">Pendentes <b>7</b></div>
        <div className="bg-white rounded-2xl p-4 shadow">Aprovados <b>143</b></div>
        <div className="bg-white rounded-2xl p-4 shadow">Cliques WhatsApp <b>89</b></div>
      </section>
      <p className="text-sm text-neutral-500">*Conecte aos dados reais após executar migrações e popular a base.</p>
    </div>
  )
}
