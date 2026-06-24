"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function EditarProdutoPage() {
  const params = useParams()
  const { id } = params
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  
  // Form state
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [oldPrice, setOldPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [isHighlight, setIsHighlight] = useState(false)
  const [isPromo, setIsPromo] = useState(false)
  
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
      }

      if (id) {
        const { data: prodData } = await supabase.from('products').select('*').eq('id', id).single()
        if (prodData) {
          setName(prodData.name)
          setPrice(prodData.price?.toString() || "")
          setOldPrice(prodData.old_price?.toString() || "")
          setIsPromo(!!prodData.old_price)
          setCategoryId(prodData.category_id || "")
          setDescription(prodData.description || "")
          setIsHighlight(prodData.is_highlight || false)
          if (prodData.images && prodData.images.length > 0) {
            setImagePreviews(prodData.images)
          } else if (prodData.image) {
            setImagePreviews([prodData.image])
          }
        }
      }
    }
    checkAuthAndFetchCategories()
  }, [router, supabase, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const priceNum = parseFloat(price.replace(',', '.'))
    const oldPriceNum = oldPrice ? parseFloat(oldPrice.replace(',', '.')) : null

    let finalImages = imagePreviews // by default use the existing ones if no new files
    let finalMainImage = imagePreviews.length > 0 ? imagePreviews[0] : ""

    if (images.length > 0) {
      // User uploaded new files, replace them
      const uploadedUrls: string[] = []
      
      for (const file of images) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)
          
        if (uploadError) {
          console.error(uploadError)
          alert("Erro ao fazer upload da imagem: " + file.name)
          setIsSubmitting(false)
          return
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
          
        uploadedUrls.push(publicUrlData.publicUrl)
      }

      finalImages = uploadedUrls
      finalMainImage = uploadedUrls.length > 0 ? uploadedUrls[0] : ""
    }

    const { error } = await supabase.from('products').update({
      name,
      price: priceNum,
      old_price: isPromo ? oldPriceNum : null,
      category_id: categoryId,
      image: finalMainImage,
      images: finalImages,
      description,
      is_highlight: isHighlight,
    }).eq('id', id)

    setIsSubmitting(false)

    if (error) {
      console.error(error)
      alert("Erro ao atualizar o produto.")
    } else {
      alert("Produto atualizado com sucesso!")
      router.push(`/produto/${id}`)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
        <p className="mt-4 text-slate-500">Verificando permissões...</p>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className={`min-h-screen bg-background ${inter.variable} ${playfair.variable} font-sans pt-12 pb-24`}>
      <div className="max-w-3xl mx-auto px-6">
        <Link href={`/produto/${id}`} className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Produto
        </Link>
        
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
            Editar Produto
          </h1>
          <p className="text-slate-500 mb-8">Atualize as informações desta peça no catálogo da loja.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Produto *</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Conjunto Rendado Aurora"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum focus:ring-1 focus:ring-brand-plum transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isPromo" 
                checked={isPromo}
                onChange={(e) => {
                  setIsPromo(e.target.checked)
                  if (!e.target.checked) {
                    setOldPrice("")
                  }
                }}
                className="w-4 h-4 text-brand-plum rounded border-slate-300 focus:ring-brand-plum"
              />
              <label htmlFor="isPromo" className="text-sm font-medium text-slate-700">Este produto está em promoção?</label>
            </div>

            {isPromo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preço Promocional (R$) *</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 129.90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum focus:ring-1 focus:ring-brand-plum transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preço Antigo / Riscado (R$) *</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    placeholder="Ex: 159.90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum focus:ring-1 focus:ring-brand-plum transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preço (R$) *</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 129.90"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum focus:ring-1 focus:ring-brand-plum transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Categoria *</label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                  required
                >
                  <option value="" disabled>Selecione uma subcategoria...</option>
                  {categories.map((group) => (
                    group.children && group.children.length > 0 ? (
                      <optgroup key={group.id} label={group.name}>
                        {group.children.map((child: any) => (
                          <option key={child.id} value={child.id}>{child.name}</option>
                        ))}
                      </optgroup>
                    ) : (
                      <option key={group.id} value={group.id} disabled>{group.name} (Crie subcategorias para adicionar produtos)</option>
                    )
                  ))}
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Imagens do Produto (A primeira será a capa) *</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-brand-plum transition-colors cursor-pointer bg-slate-50 flex flex-col items-center justify-center text-center relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files)
                      setImages(files)
                      const previews = files.map(file => URL.createObjectURL(file))
                      setImagePreviews(previews)
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 font-medium">Clique para selecionar ou arraste as fotos</p>
                <p className="text-xs text-slate-400 mt-1">Recomendado: 1000x1200 px (até 5MB)</p>
              </div>
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                      <Image src={preview} alt={`Preview ${index}`} fill className="object-contain" />
                      {index === 0 && (
                        <div className="absolute top-0 left-0 right-0 bg-brand-plum/90 text-white text-[10px] uppercase font-bold text-center py-1 backdrop-blur-sm z-10">
                          Capa
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes sobre o produto..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum focus:ring-1 focus:ring-brand-plum transition-all"
              />
            </div>

            <div className="flex items-center space-x-3 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
              <input
                type="checkbox"
                id="isHighlight"
                checked={isHighlight}
                onChange={(e) => setIsHighlight(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
              />
              <label htmlFor="isHighlight" className="text-sm font-medium text-slate-700">
                ⭐ Destacar na página de Destaques?
              </label>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Atualizando...</>
                ) : (
                  <><Save className="w-5 h-5 mr-2" /> Salvar Alterações</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
