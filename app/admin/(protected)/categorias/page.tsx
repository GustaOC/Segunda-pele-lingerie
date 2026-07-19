"use client";
import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, Folder, FolderOpen, Grid, Trash2, X, ArrowLeft } from "lucide-react"
import Link from "next/link"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function CategoriasPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"CAT" | "SUBCAT" | "MODELO">("CAT")
  const [parentId, setParentId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchCategories = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) {
      setCategories(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const buildTree = () => {
    const level1 = categories.filter(c => !c.parent_id)
    return level1.map(l1 => ({
      ...l1,
      children: categories.filter(c => c.parent_id === l1.id).map(l2 => ({
        ...l2,
        children: categories.filter(c => c.parent_id === l2.id)
      }))
    }))
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const openModal = (type: "CAT" | "SUBCAT" | "MODELO", parentId: string | null = null) => {
    setModalType(type)
    setParentId(parentId)
    setNewName("")
    setIsModalOpen(true)
  }

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    if (!newName.trim()) {
      alert("Preencha o nome.")
      setSubmitting(false)
      return
    }

    const slug = generateSlug(newName)

    try {
      const { error } = await (supabase.from('categories') as any).insert({
        name: newName,
        slug,
        parent_id: parentId
      })

      if (error) throw error

      setIsModalOpen(false)
      fetchCategories()
    } catch (err) {
      console.error(err)
      alert("Erro ao criar. Talvez já exista um item com esse nome/slug.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir? Você não pode excluir se houver produtos vinculados ou se houver subitens.")) return
    
    try {
      const { error } = await (supabase.from('categories') as any).delete().eq('id', id)
      if (error) {
         if (error.code === '23503') alert("Não é possível excluir pois existem produtos ou subcategorias vinculadas.")
         else alert("Erro ao excluir.")
      } else {
        fetchCategories()
      }
    } catch(e) {
      console.error(e)
    }
  }

  const tree = buildTree()

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
                Gerenciar Categorias
              </h1>
            </div>
            <p className="text-slate-500 mt-1 pl-11">Crie e organize categorias, subcategorias e modelos.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => openModal("CAT")}
              className="bg-brand-plum hover:bg-brand-plum/90 text-white rounded-full px-6 shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
             {tree.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Nenhuma categoria cadastrada.</div>
             ) : (
               <div className="space-y-4">
                 {tree.map(cat => (
                   <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                     {/* Level 1: Category */}
                     <div className="bg-slate-50 p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleExpand(cat.id)}>
                         {expanded[cat.id] ? <FolderOpen className="w-5 h-5 text-brand-plum" /> : <Folder className="w-5 h-5 text-slate-400" />}
                         <span className="font-bold text-slate-800 text-lg">{cat.name}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" onClick={() => openModal("SUBCAT", cat.id)} className="text-slate-600 hover:text-brand-plum hover:bg-brand-peach/30">
                           <Plus className="w-4 h-4 mr-1" /> Subcategoria
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     </div>

                     {/* Level 2: Subcategories */}
                     {expanded[cat.id] && cat.children.length > 0 && (
                       <div className="p-4 pl-12 border-t border-slate-200 space-y-4">
                         {cat.children.map((sub: any) => (
                           <div key={sub.id} className="border border-slate-100 rounded-lg overflow-hidden bg-white">
                             <div className="p-3 flex items-center justify-between border-b border-slate-50">
                               <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleExpand(sub.id)}>
                                 {expanded[sub.id] ? <FolderOpen className="w-4 h-4 text-brand-plum" /> : <Folder className="w-4 h-4 text-slate-400" />}
                                 <span className="font-semibold text-slate-700">{sub.name}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Button variant="ghost" size="sm" onClick={() => openModal("MODELO", sub.id)} className="text-slate-500 hover:text-brand-plum hover:bg-brand-peach/30 text-xs">
                                   <Plus className="w-3 h-3 mr-1" /> Modelo
                                 </Button>
                                 <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 w-8 h-8">
                                   <Trash2 className="w-3 h-3" />
                                 </Button>
                               </div>
                             </div>

                             {/* Level 3: Models */}
                             {expanded[sub.id] && sub.children && sub.children.length > 0 && (
                               <div className="p-3 pl-10 bg-slate-50/50 space-y-2 border-t border-slate-100">
                                 {sub.children.map((model: any) => (
                                   <div key={model.id} className="flex items-center justify-between bg-white p-2 px-4 rounded-md border border-slate-100 shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <Grid className="w-3 h-3 text-brand-plum" />
                                        <span className="text-sm text-slate-600">{model.name}</span>
                                      </div>
                                      <Button variant="ghost" size="icon" onClick={() => handleDelete(model.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 w-6 h-6">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                   </div>
                                 ))}
                               </div>
                             )}
                             {expanded[sub.id] && (!sub.children || sub.children.length === 0) && (
                                <div className="p-3 pl-10 text-xs text-slate-400 italic bg-slate-50/50 border-t border-slate-100">Nenhum modelo cadastrado.</div>
                             )}
                           </div>
                         ))}
                       </div>
                     )}
                     {expanded[cat.id] && cat.children.length === 0 && (
                       <div className="p-4 pl-12 text-sm text-slate-400 italic border-t border-slate-200">Nenhuma subcategoria cadastrada.</div>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
                {modalType === "CAT" ? "Nova Categoria" : modalType === "SUBCAT" ? "Nova Subcategoria" : "Novo Modelo"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={modalType === "CAT" ? "Ex: Linha Noite" : modalType === "SUBCAT" ? "Ex: Shortdoll" : "Ex: Short doll liganet"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-brand-plum hover:bg-brand-plum/90 text-white rounded-xl"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
