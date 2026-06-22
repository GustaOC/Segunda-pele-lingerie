"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, Heart, Loader2 } from "lucide-react"
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
  const supabase = createClient()
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
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

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans`}>
      <Navbar />

      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-[#5D3A5B] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Home
        </Link>
        
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              {loading ? <Loader2 className="w-8 h-8 animate-spin text-[#5D3A5B]" /> : categoryName}
            </h1>
            <p className="text-slate-500 text-lg">Encontre as melhores peças de nossa coleção.</p>
          </div>
        </div>

        {!loading && subCategories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Navegue por subcategorias:</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subCategories.map((sub: any) => (
                <Link key={sub.id} href={`/categoria/${sub.slug}`} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#5D3A5B] hover:shadow-md transition-all group">
                  <h3 className="text-lg font-medium text-slate-700 group-hover:text-[#5D3A5B] transition-colors">{sub.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && products.length === 0 && subCategories.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
             <p className="text-xl text-slate-500">Nenhum produto cadastrado nesta categoria ainda.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link href={`/produto/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                <div className="relative h-[380px] overflow-hidden bg-slate-100">
                  <FavoriteButton productId={product.id} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300" />
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center mb-2">
                    {[...Array(product.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <div className="text-lg font-medium text-slate-900 group-hover:text-[#5D3A5B] transition-colors mb-2 line-clamp-2">
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
  )
}
