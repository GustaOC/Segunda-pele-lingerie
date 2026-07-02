"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, Heart, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/Navbar"
import { FavoriteButton } from "@/components/FavoriteButton"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const [products, setProducts] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [categoryId, setCategoryId] = useState("")
  
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])

  const supabase = createClient()
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      // Check admin status
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === 'admin@segundapele.com') {
        setIsAdmin(true)
      }

      // 1. Busca a categoria atual e as suas filhas (se existirem)
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('*, children:categories(*)')
        .eq('slug', params.slug)
        .single()
      
      if (catError || !category) {
        setCategoryName("Categoria não encontrada")
        setLoading(false)
        return
      }

      setCategoryName(category.name)
      setCategoryId(category.id)

      // Monta array de IDs de categoria permitidos (a categoria atual + filhas)
      const allowedCategoryIds = [category.id]
      if (category.children && category.children.length > 0) {
        setSubCategories(category.children)
        category.children.forEach((child: any) => allowedCategoryIds.push(child.id))
      }

      // 2. Busca os produtos pertencentes a essas categorias
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('category_id', allowedCategoryIds)
      
      if (!prodError && productsData) {
        setProducts(productsData)
      }
      
      setLoading(false)
    }
    fetchCategoryAndProducts()
  }, [params.slug, supabase])

  // Derive available filters from loaded products
  let availableSizes = Array.from(new Set(products.flatMap(p => p.sizes || []))).sort()
  let availableColors = Array.from(new Set(products.flatMap(p => p.colors?.map((c: any) => c.name) || []))).sort()

  // Se a categoria estiver vazia ou não tiver tamanhos/cores, usamos um padrão para o layout não quebrar
  if (availableSizes.length === 0) {
    availableSizes = ['P', 'M', 'G', 'GG']
  }
  if (availableColors.length === 0) {
    availableColors = ['Preto', 'Branco', 'Nude', 'Vermelho']
  }

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])
  }

  const toggleColor = (colorName: string) => {
    setSelectedColors(prev => prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName])
  }

  const filteredProducts = products.filter(p => {
    const matchSize = selectedSizes.length === 0 || (p.sizes && p.sizes.some((s: string) => selectedSizes.includes(s)))
    const matchColor = selectedColors.length === 0 || (p.colors && p.colors.some((c: any) => selectedColors.includes(c.name)))
    return matchSize && matchColor
  })

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans`}>
      <Navbar />

      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Home
        </Link>
        
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              {loading ? <Loader2 className="w-8 h-8 animate-spin text-brand-plum" /> : categoryName}
            </h1>
            <p className="text-slate-500 text-lg">Encontre as melhores peças de nossa coleção.</p>
          </div>
          <div className="flex items-center space-x-4">
            {!loading && isAdmin && subCategories.length === 0 && (
              <Link href="/admin/novo-produto">
                <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shadow-md flex items-center transition-all mb-2">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Produto
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Sidebar */}
          {!loading && (subCategories.length > 0 || availableSizes.length > 0 || availableColors.length > 0) && (
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-32">
                
                {/* Filtros */}
                {(availableSizes.length > 0 || availableColors.length > 0) && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Filtros</h2>
                    
                    {availableSizes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Tamanhos</h3>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map(size => (
                            <button
                              key={size}
                              onClick={() => toggleSize(size)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2 ${selectedSizes.includes(size) ? 'border-brand-plum bg-brand-plum text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableColors.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Cores</h3>
                        <div className="flex flex-col gap-2">
                          {availableColors.map(color => (
                            <label key={color} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${selectedColors.includes(color) ? 'bg-brand-plum border-brand-plum' : 'border-slate-300 bg-white group-hover:border-brand-plum'}`}>
                                {selectedColors.includes(color) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <span className="text-slate-600 group-hover:text-brand-plum transition-colors">{color}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Subcategorias */}
                {subCategories.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Subcategorias</h2>
                    <ul className="space-y-2">
                      {subCategories.map((sub: any) => (
                        <li key={sub.id}>
                          <Link href={`/categoria/${sub.slug}`} className={`block px-4 py-2.5 rounded-xl font-medium transition-colors ${sub.id === categoryId ? 'bg-brand-peach/40 text-brand-plum shadow-sm' : 'text-slate-600 hover:bg-brand-peach/20 hover:text-brand-plum'}`}>
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Product Grid Area */}
          <div className="flex-1">
            {!loading && filteredProducts.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                 <p className="text-xl text-slate-500">Nenhum produto cadastrado nesta categoria ainda.</p>
               </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${subCategories.length > 0 || availableSizes.length > 0 || availableColors.length > 0 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-6`}>
                {filteredProducts.map((product) => (
                  <Link href={`/produto/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                    <div className="relative h-[320px] overflow-hidden bg-slate-100">
                      <FavoriteButton productId={product.id} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300" />
                      <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center mb-2">
                        {[...Array(product.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      <div className="text-base font-medium text-slate-900 group-hover:text-brand-plum transition-colors mb-2 line-clamp-2">
                        {product.name}
                      </div>
                      <div className="mt-auto flex items-center space-x-3">
                        <span className="text-lg font-bold text-slate-900">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                        {product.old_price && (
                           <span className="text-sm text-slate-400 line-through">R$ {product.old_price.toFixed(2).replace('.', ',')}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
