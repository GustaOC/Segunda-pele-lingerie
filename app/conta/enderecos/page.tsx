"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, MapPin, Plus, Trash2, Edit2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function EnderecosPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [addresses, setAddresses] = useState<any[]>([])
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    id: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    is_default: false
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
        fetchAddresses(session.user.id)
      }
    }
    fetchSession()
  }, [router, supabase.auth])

  const fetchAddresses = async (userId: string) => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (data) setAddresses(data)
    setIsLoading(false)
  }

  const handleCepSearch = async (cepStr: string) => {
    const cleanCep = cepStr.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, cep: cepStr }))
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }))
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const addressData = {
        user_id: user.id,
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        is_default: formData.is_default || addresses.length === 0
      }

      // Se for marcar como padrão, remove o padrão dos outros
      if (addressData.is_default) {
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
      }

      if (formData.id) {
        await supabase.from('user_addresses').update(addressData).eq('id', formData.id)
      } else {
        await supabase.from('user_addresses').insert([addressData])
      }

      await fetchAddresses(user.id)
      setIsFormOpen(false)
      resetForm()
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar endereço.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este endereço?")) return
    await supabase.from('user_addresses').delete().eq('id', id)
    await fetchAddresses(user.id)
  }

  const handleSetDefault = async (id: string) => {
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('user_addresses').update({ is_default: true }).eq('id', id)
    await fetchAddresses(user.id)
  }

  const resetForm = () => {
    setFormData({
      id: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", is_default: false
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans pt-12 pb-24`}>
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/conta" className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Minha Conta
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: "var(--font-playfair)" }}>
            Meus Endereços
          </h1>
          {!isFormOpen && (
            <Button onClick={() => { resetForm(); setIsFormOpen(true) }} className="bg-brand-plum text-white hover:bg-brand-plum/90 rounded-full px-6">
              <Plus className="w-4 h-4 mr-2" />
              Novo Endereço
            </Button>
          )}
        </div>

        {isFormOpen ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{formData.id ? "Editar Endereço" : "Novo Endereço"}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CEP *</label>
                  <input
                    type="text"
                    required
                    value={formData.cep}
                    onChange={(e) => handleCepSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logradouro / Rua *</label>
                  <input
                    type="text"
                    required
                    value={formData.logradouro}
                    onChange={(e) => setFormData({...formData, logradouro: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número *</label>
                  <input
                    type="text"
                    required
                    value={formData.numero}
                    onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bairro *</label>
                  <input
                    type="text"
                    required
                    value={formData.bairro}
                    onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cidade *</label>
                    <input
                      type="text"
                      required
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF) *</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum uppercase"
                    />
                  </div>
                </div>
              </div>

              {!formData.is_default && addresses.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                    className="rounded border-slate-300 text-brand-plum focus:ring-brand-plum"
                  />
                  <label htmlFor="is_default" className="text-sm text-slate-700">Definir como endereço padrão</label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-brand-plum text-white hover:bg-brand-plum/90">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Endereço
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum endereço cadastrado</h3>
                <p className="text-slate-500 mb-6">Cadastre um endereço para facilitar suas próximas compras.</p>
                <Button onClick={() => setIsFormOpen(true)} className="bg-brand-plum text-white hover:bg-brand-plum/90 rounded-full">
                  Cadastrar Endereço
                </Button>
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className={`bg-white p-6 rounded-3xl shadow-sm border ${addr.is_default ? 'border-brand-plum ring-1 ring-brand-plum/20' : 'border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${addr.is_default ? 'bg-brand-peach text-brand-plum' : 'bg-slate-100 text-slate-400'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center">
                          {addr.logradouro}, {addr.numero}
                          {addr.is_default && <span className="ml-2 text-[10px] uppercase bg-brand-plum text-white px-2 py-0.5 rounded-full font-bold tracking-wider">Padrão</span>}
                        </h4>
                        <p className="text-sm text-slate-500">CEP {addr.cep}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pl-[52px] text-sm text-slate-600 mb-6 space-y-1 text-left">
                    {addr.complemento && <p>{addr.complemento}</p>}
                    <p>{addr.bairro}</p>
                    <p>{addr.cidade} - {addr.estado}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 border-t border-slate-100 pt-4 mt-auto">
                    {!addr.is_default && (
                      <Button onClick={() => handleSetDefault(addr.id)} variant="ghost" size="sm" className="text-slate-500 hover:text-brand-plum mr-auto">
                        Definir como Padrão
                      </Button>
                    )}
                    <div className={addr.is_default ? "ml-auto" : ""}></div>
                    <Button onClick={() => { setFormData(addr); setIsFormOpen(true); }} variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleDelete(addr.id)} variant="ghost" size="icon" className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
