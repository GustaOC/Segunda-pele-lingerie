"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Search, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { SearchableSelect } from "@/components/ui/searchable-select"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function AtivarEcommercePage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  // Selection
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productData, setProductData] = useState<any>(null)

  // E-commerce data
  const [mainCategoryId, setMainCategoryId] = useState("")
  const [subCategoryId, setSubCategoryId] = useState("")
  const [modelId, setModelId] = useState("")
  const [allCategories, setAllCategories] = useState<any[]>([])
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [isHighlight, setIsHighlight] = useState(false)
  
  const [isPromo, setIsPromo] = useState(false)
  const [promoPrice, setPromoPrice] = useState("")
  
  const [colorImageFiles, setColorImageFiles] = useState<Record<string, {files: File[], previews: string[]}>>({})
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email !== 'admin@segundapele.com') {
        router.push("/")
        return
      }
      setIsAdmin(true)
      setIsCheckingAuth(false)

      const { data: catData } = await supabase.from('categories').select('*').order('name')
      if (catData) {
        setAllCategories(catData)
        const parents = catData.filter(c => !c.parent_id)
        const grouped = parents.map(parent => ({
          ...parent,
          children: catData.filter(c => c.parent_id === parent.id).map(child => ({
            ...child,
            children: catData.filter(model => model.parent_id === child.id)
          }))
        }))
        setCategories(grouped)
      }

      // Fetch base products that might need activation or update
      const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (prodData) {
        setProducts(prodData)
      }
    }
    checkAuthAndFetch()
  }, [router, supabase])

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id)
    const p = products.find(prod => prod.id === id)
    setProductData(p)
    
    if (p) {
      if (p.category_id && allCategories.length > 0) {
        let current = allCategories.find(c => c.id === p.category_id)
        let path = []
        while (current) {
          path.unshift(current)
          current = allCategories.find(c => c.id === current.parent_id)
        }
        if (path.length > 0) setMainCategoryId(path[0].id)
        else setMainCategoryId("")
        
        if (path.length > 1) setSubCategoryId(path[1].id)
        else setSubCategoryId("")
        
        if (path.length > 2) setModelId(path[2].id)
        else setModelId("")
      } else {
        setMainCategoryId("")
        setSubCategoryId("")
        setModelId("")
      }
      
      setDescription(p.description || "")
      setIsHighlight(p.is_highlight || false)
      
      if (p.old_price && p.price < p.old_price) {
        setIsPromo(true)
        setPromoPrice(p.price.toString().replace('.', ','))
      } else {
        setIsPromo(false)
        setPromoPrice("")
      }

      // Initialize color image slots
      const initialColorFiles: Record<string, {files: File[], previews: string[]}> = {}
      if (p.colors && p.colors.length > 0) {
        p.colors.forEach((c: any) => {
          initialColorFiles[c.name] = { files: [], previews: [] }
        })
      }
      setColorImageFiles(initialColorFiles)
      setImages([])
      setImagePreviews([])
    } else {
      setProductData(null)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setImages(prev => [...prev, ...filesArray])
      
      const previewsArray = filesArray.map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...previewsArray])
    }
  }

  const handleColorImageChange = (colorName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      const previewsArray = filesArray.map(file => URL.createObjectURL(file))
      
      setColorImageFiles(prev => ({
        ...prev,
        [colorName]: {
          files: [...(prev[colorName]?.files || []), ...filesArray],
          previews: [...(prev[colorName]?.previews || []), ...previewsArray]
        }
      }))
    }
  }

  const removeColorImage = (colorName: string, index: number) => {
    setColorImageFiles(prev => {
      const current = prev[colorName]
      const newFiles = [...current.files]
      const newPreviews = [...current.previews]
      newFiles.splice(index, 1)
      newPreviews.splice(index, 1)
      return {
        ...prev,
        [colorName]: { files: newFiles, previews: newPreviews }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!selectedProductId) {
      alert("Selecione um produto base primeiro.")
      setIsSubmitting(false)
      return
    }

    if (images.length === 0 && (!productData.images || productData.images.length === 0)) {
      alert("É obrigatório adicionar pelo menos uma imagem geral do produto.")
      setIsSubmitting(false)
      return
    }

    if (!description.trim()) {
      alert("É obrigatório adicionar a descrição do produto.")
      setIsSubmitting(false)
      return
    }

    let finalGeneralImages = productData.images || []
    
    if (images.length > 0) {
      for (const file of images) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
          
        if (uploadError) {
          console.error("Upload error:", uploadError)
          alert("Erro ao fazer upload da imagem: " + file.name)
          setIsSubmitting(false)
          return
        }
        
        const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        finalGeneralImages.push(publicUrlData.publicUrl)
      }
    }

    let updatedColors = []
    if (productData.colors) {
      for (const color of productData.colors) {
        const colorFiles = colorImageFiles[color.name]?.files || []
        let newColorImages = color.images || []
        
        for (const file of colorFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)
            
          if (uploadError) {
            console.error("Upload error:", uploadError)
            alert(`Erro ao fazer upload da imagem da cor ${color.name}`)
            setIsSubmitting(false)
            return
          }
          
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
          newColorImages.push(publicUrlData.publicUrl)
        }
        
        updatedColors.push({
          ...color,
          images: newColorImages
        })
      }
    }

    const basePrice = productData.price
    let finalPrice = basePrice
    let finalOldPrice = null
    
    if (isPromo && promoPrice) {
      const pPriceNum = parseFloat(promoPrice.replace(',', '.'))
      if (!isNaN(pPriceNum)) {
        finalPrice = pPriceNum
        finalOldPrice = basePrice
      }
    }

    const finalCategoryId = modelId || subCategoryId || mainCategoryId

    const { error } = await supabase.from('products').update({
      category_id: finalCategoryId || null,
      image: finalGeneralImages.length > 0 ? finalGeneralImages[0] : "",
      images: finalGeneralImages,
      colors: updatedColors,
      description,
      is_active: true,
      is_highlight: isHighlight,
      price: finalPrice,
      old_price: finalOldPrice
    }).eq('id', selectedProductId)

    if (error) {
      console.error(error)
      alert("Erro ao ativar produto no e-commerce.")
    } else {
      router.push("/admin")
    }
    
    setIsSubmitting(false)
  }

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>
  }

  if (!isAdmin) return null

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center text-slate-500 hover:text-brand-plum mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Produtos
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
            Ativar no E-commerce
          </h1>
          <p className="text-slate-500 mt-2">Puxe um produto do Estoque Geral e adicione fotos e descrição para mostrá-lo na loja virtual.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
          
          <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
              <Search className="w-5 h-5 mr-2 text-brand-plum" />
              1. Selecionar Produto do Estoque
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Buscar Produto por SKU / Nome</label>
                <SearchableSelect
                  options={products.map(p => ({
                    value: p.id,
                    label: `${p.sku ? `[${p.sku}] ` : ''}${p.name} ${p.is_active ? '(Já Ativo)' : ''}`,
                    searchString: `${p.sku || ''} ${p.name} ${Array.isArray(p.colors) ? p.colors.join(' ') : (p.colors || '')} ${Array.isArray(p.sizes) ? p.sizes.join(' ') : (p.sizes || '')} ${p.is_active ? 'Ativo' : ''}`
                  }))}
                  value={selectedProductId}
                  onChange={(val) => handleProductSelect(val)}
                  placeholder="Selecione um produto..."
                />
              </div>

              {productData && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Nome Base</span>
                    <span className="font-bold text-slate-800">{productData.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Preço Base</span>
                    <span className="font-bold text-slate-800">R$ {productData.price?.toFixed(2).replace('.',',')}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Cores Base</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {productData.colors?.map((c:any) => c.name).join(', ') || 'Nenhuma'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Tamanhos Base</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {productData.sizes?.join(', ') || 'Nenhum'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {productData && (
            <>
              <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-brand-plum" />
                  2. Dados para Loja Virtual
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Categoria Principal *</label>
                      <select 
                        required
                        value={mainCategoryId} 
                        onChange={(e) => {
                          setMainCategoryId(e.target.value)
                          setSubCategoryId("")
                          setModelId("")
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                      >
                        <option value="" disabled>Selecione a categoria principal...</option>
                        {categories.map((parent) => (
                          <option key={parent.id} value={parent.id}>{parent.name}</option>
                        ))}
                      </select>
                    </div>

                    {mainCategoryId && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Subcategoria *</label>
                        <select 
                          required
                          value={subCategoryId} 
                          onChange={(e) => {
                            setSubCategoryId(e.target.value)
                            setModelId("")
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                        >
                          <option value="" disabled>Selecione a subcategoria...</option>
                          {categories.find(c => c.id === mainCategoryId)?.children?.map((child: any) => (
                            <option key={child.id} value={child.id}>{child.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {subCategoryId && categories.find(c => c.id === mainCategoryId)?.children?.find((c: any) => c.id === subCategoryId)?.children?.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Modelo (Opcional)</label>
                        <select 
                          value={modelId} 
                          onChange={(e) => setModelId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                        >
                          <option value="">Nenhum modelo específico</option>
                          {categories.find(c => c.id === mainCategoryId)?.children?.find((c: any) => c.id === subCategoryId)?.children?.map((model: any) => (
                            <option key={model.id} value={model.id}>{model.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                      <input
                        type="checkbox"
                        id="isPromo"
                        checked={isPromo}
                        onChange={(e) => setIsPromo(e.target.checked)}
                        className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="isPromo" className="text-sm font-medium text-purple-900">
                        Ativar Preço Promocional?
                      </label>
                    </div>
                    {isPromo && (
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Novo Preço na Promoção (R$)</label>
                        <input
                          type="text"
                          required={isPromo}
                          value={promoPrice}
                          onChange={(e) => setPromoPrice(e.target.value)}
                          placeholder="Ex: 99,90"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">O preço base de R$ {productData.price?.toFixed(2).replace('.',',')} aparecerá riscado.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descrição *</label>
                  <textarea 
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes sobre o produto para o cliente..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum transition-all"
                  />
                </div>

                <div className="flex items-center space-x-3 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <input
                    type="checkbox"
                    id="isHighlight"
                    checked={isHighlight}
                    onChange={(e) => setIsHighlight(e.target.checked)}
                    className="w-5 h-5 rounded border-yellow-300 text-yellow-500 focus:ring-yellow-500"
                  />
                  <label htmlFor="isHighlight" className="text-sm font-medium text-yellow-900">
                    ⭐ Mostrar na seção de "Destaques" da Home?
                  </label>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-brand-plum" />
                  3. Imagens do Produto
                </h3>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-800 mb-2">Fotos Gerais do Produto *</label>
                  <p className="text-xs text-slate-500 mb-4">Estas fotos aparecerão para todas as cores caso a cor específica não tenha foto.</p>
                  
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500"><span className="font-semibold">Clique para fazer upload</span></p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  
                  {(imagePreviews.length > 0 || (productData.images && productData.images.length > 0)) && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 mt-4">
                      {productData.images?.map((url: string, index: number) => (
                        <div key={`old-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm opacity-60">
                          <Image src={url} alt={`Antiga ${index}`} fill className="object-cover" />
                        </div>
                      ))}
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                          <Image src={preview} alt={`Preview ${index}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = [...images]; newImages.splice(index, 1); setImages(newImages);
                              const newPreviews = [...imagePreviews]; newPreviews.splice(index, 1); setImagePreviews(newPreviews);
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {productData.colors && productData.colors.length > 0 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-800">Fotos Específicas por Cor</label>
                    <p className="text-xs text-slate-500">Opcional. Se enviar fotos aqui, quando a cliente clicar na cor, apenas essas fotos aparecerão.</p>
                    
                    {productData.colors.map((color: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 rounded-full border border-slate-300 shadow-inner" style={{backgroundColor: color.hex}}></div>
                          <span className="font-bold text-slate-700">{color.name}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 items-start">
                          <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 shrink-0">
                            <Plus className="w-6 h-6 text-slate-400" />
                            <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleColorImageChange(color.name, e)} />
                          </label>

                          {color.images?.map((url: string, index: number) => (
                            <div key={`old-c-${index}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 opacity-60 shrink-0">
                              <Image src={url} alt={`Cor Antiga ${index}`} fill className="object-cover" />
                            </div>
                          ))}
                          
                          {colorImageFiles[color.name]?.previews.map((preview, index) => (
                            <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group shrink-0">
                              <Image src={preview} alt={`Preview Cor ${index}`} fill className="object-cover" />
                              <button
                                type="button"
                                onClick={() => removeColorImage(color.name, index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-8 py-6 shadow-md text-lg w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Ativando...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-2" /> Ativar Produto no E-commerce</>
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
