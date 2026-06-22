"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function NovoProdutoPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  
  // Form state
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [oldPrice, setOldPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchCategories = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email !== 'admin@segundapele.com') {
        router.push("/")
        return
      }
      setIsAdmin(true)
      setIsCheckingAuth(false)

      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (data) {
        // Group categories for the select input
        const parents = data.filter(c => !c.parent_id)
        const grouped = parents.map(parent => ({
          ...parent,
          children: data.filter(c => c.parent_id === parent.id)
        }))
        setCategories(grouped)
        
        // Find a default category ID (preferably a child if exists)
        const firstParent = grouped[0]
        if (firstParent) {
           if (firstParent.children.length > 0) setCategoryId(firstParent.children[0].id)
           else setCategoryId(firstParent.id)
        }
      }
    }
    checkAuthAndFetchCategories()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const priceNum = parseFloat(price.replace(',', '.'))
    const oldPriceNum = oldPrice ? parseFloat(oldPrice.replace(',', '.')) : null

    const { error } = await supabase.from('products').insert({
      name,
      price: priceNum,
      old_price: oldPriceNum,
      category_id: categoryId,
      image,
      description,
      is_active: true,
      sizes: ['P', 'M', 'G', 'GG'] // Default mockado
    })

    setIsSubmitting(false)

    if (error) {
      console.error(error)
      alert("Erro ao criar o produto.")
    } else {
      alert("Produto criado com sucesso!")
      router.push("/")
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D3A5B]" />
        <p className="mt-4 text-slate-500">Verificando permissões...</p>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans pt-12 pb-24`}>
      <div className="max-w-3xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-[#5D3A5B] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Catálogo
        </Link>
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
            Novo Produto
          </h1>
          <p className="text-slate-500 mb-8">Cadastre uma nova peça no catálogo da loja.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Produto *</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Conjunto Rendado Aurora"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D3A5B] focus:ring-1 focus:ring-[#5D3A5B] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preço (R$) *</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 129.90"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D3A5B] focus:ring-1 focus:ring-[#5D3A5B] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preço Antigo / Riscado (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                  placeholder="Ex: 159.90 (Opcional)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D3A5B] focus:ring-1 focus:ring-[#5D3A5B] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  {categories.map((group) => (
                    group.children && group.children.length > 0 ? (
                      <optgroup key={group.id} label={group.name}>
                        {group.children.map((child: any) => (
                          <option key={child.id} value={child.id}>{child.name}</option>
                        ))}
                      </optgroup>
                    ) : (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    )
                  ))}
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">URL da Imagem *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  required
                  type="url" 
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[#5D3A5B] focus:ring-1 focus:ring-[#5D3A5B] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os detalhes da peça..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#5D3A5B] focus:ring-1 focus:ring-[#5D3A5B] transition-all resize-none"
              />
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl h-14 text-lg shadow-md transition-all flex justify-center items-center font-bold"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvar Produto
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
