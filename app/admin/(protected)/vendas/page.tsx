"use client"

import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, ShoppingCart, RefreshCw, Box, Tag, ArrowLeft, Check, ChevronsUpDown, Trash2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function VendasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [promoters, setPromoters] = useState<any[]>([])

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")

  
  // PDV State
  const [mode, setMode] = useState<'RETAIL' | 'WHOLESALE' | 'EXCHANGE'>('RETAIL')
  
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [prodComboboxOpen, setProdComboboxOpen] = useState(false)
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0])
  
  // For Promoter mode
  const [selectedPromoterId, setSelectedPromoterId] = useState("")

  // For Exchange mode (Troca)
  const [exchangeSourceType, setExchangeSourceType] = useState<'OUT_RETAIL' | 'OUT_WHOLESALE' | 'OUT_PROMOTER' | ''>('')
  const [selectedTransactionId, setSelectedTransactionId] = useState("")
  const [txComboboxOpen, setTxComboboxOpen] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [exchangePromoterId, setExchangePromoterId] = useState("")
  const [exchangeResellerId, setExchangeResellerId] = useState("")
  const [resellers, setResellers] = useState<any[]>([])
  const [exchangePromoterInventory, setExchangePromoterInventory] = useState<any[]>([])

  const [returnProductId, setReturnProductId] = useState("")
  const [returnSize, setReturnSize] = useState("")
  const [returnColor, setReturnColor] = useState("")
  const [returnPeriod, setReturnPeriod] = useState("")
  const [returnAvailablePeriods, setReturnAvailablePeriods] = useState<any[]>([])
  const [returnCartItems, setReturnCartItems] = useState<any[]>([])
  const [returnQuantity, setReturnQuantity] = useState(1)

  const [exchangeResellerInventory, setExchangeResellerInventory] = useState<any[]>([])
  const [exchangeResellerKits, setExchangeResellerKits] = useState<any[]>([])
  const [exchangeKitId, setExchangeKitId] = useState("")
  
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([])

  const [exchangePeriod, setExchangePeriod] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [maxQuantity, setMaxQuantity] = useState(0)

  // Cart state
  const [cartItems, setCartItems] = useState<any[]>([])

  // Consumidor state
  const [isConsumerSale, setIsConsumerSale] = useState(false)
  const [nextSaleId, setNextSaleId] = useState(1)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [prodRes, transRes, reselRes, consultRes, consumerTxRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, colors, sizes'),
        supabase.from('inventory_transactions').select('*, products(id, name, sku)').in('type', ['OUT_RETAIL', 'OUT_WHOLESALE']).order('created_at', { ascending: false }).limit(200),
        supabase.from('resellers').select('*').order('name'),
        supabase.from('consultant').select('*').order('name'),
        supabase.from('inventory_transactions').select('notes').or('notes.ilike.%Consumidor #%,notes.ilike.%Venda #%')
      ])

      if (consumerTxRes && consumerTxRes.data) {
        let maxId = 0;
        consumerTxRes.data.forEach((tx) => {
          const match = tx.notes?.match(/(?:Consumidor|Venda) #(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxId) maxId = num;
          }
        });
        setNextSaleId(maxId + 1);
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        let currentRole = ""
        if (session) {
          setCurrentUser(session.user)
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
          currentRole = (profile as any)?.role || session.user.user_metadata?.role || ""
          setUserRole(currentRole)
        }

        const res = await fetch('/api/admin/user')
        const usersRes = await res.json()
        if (usersRes.data) {
          let promotersList = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role))
          
          if (consultRes && consultRes.data) {
            consultRes.data.forEach((c: any) => {
              if (!promotersList.find((p: any) => p.email === c.email || p.id === c.id)) {
                promotersList.push({ id: c.id, nome: c.name, email: c.email, role: 'CONSULTANT' });
              }
            });
          }
          
          if (currentRole === 'PROMOTOR' || currentRole === 'CONSULTANT') {
            promotersList = promotersList.filter((u: any) => u.id === session?.user.id)
            if (promotersList.length > 0) {
              setExchangePromoterId(promotersList[0].id)
              setSelectedPromoterId(promotersList[0].id)
            }
          }
          setPromoters(promotersList)
          
          const allPeople: any[] = []
          if (usersRes.data) {
            // Only add users whose role is USER (Clients)
            const clientsOnly = usersRes.data.filter((u: any) => u.role === 'USER');
            allPeople.push(...clientsOnly.map((u: any) => ({ id: u.id, nome: u.nome || u.email || 'Sem Nome', role: 'Cliente', cpf: u.cpf })))
          }
          setClients(allPeople)
        }
      } catch (e) {
        console.error(e)
      }

      if (prodRes.data) setProducts(prodRes.data)
      if (transRes.data) setRecentTransactions(transRes.data)
      if (reselRes.data) setResellers(reselRes.data)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedTransactionId && (exchangeSourceType === 'OUT_RETAIL' || exchangeSourceType === 'OUT_WHOLESALE')) {
      const tx = recentTransactions.find(t => t.id === selectedTransactionId)
      if (tx) {
        setReturnProductId(tx.product_id)
        setReturnColor(tx.color)
        setReturnSize(tx.size)
      }
    }
  }, [selectedTransactionId, recentTransactions, exchangeSourceType])

  useEffect(() => {
    async function fetchPromoterInv() {
      if (!exchangePromoterId) {
        setExchangePromoterInventory([])
        return
      }
      let query = supabase.from('promoter_inventory').select('*, products(name, sku)').eq('promoter_id', exchangePromoterId)
      if (exchangePeriod) {
        query = query.eq('period', exchangePeriod)
      } else {
        query = query.is('period', null)
      }
      const { data } = await query
      if (data) setExchangePromoterInventory(data)
      
      const { data: invWithQty } = await supabase.from('promoter_inventory')
        .select('period')
        .eq('promoter_id', exchangePromoterId)
        .gt('quantity', 0)
        
      const { data: activeKits } = await supabase.from('promoter_kits')
        .select('period, name')
        .eq('promoter_id', exchangePromoterId)
        
      const activeKitPeriods = (activeKits || [])
        .filter(k => !k.name?.includes('[FINALIZADO]') && !k.name?.includes('[ACERTADO]'))
        .map(k => k.period)
        
      const allValidPeriods = [
        ...activeKitPeriods
      ]
      
      const unique = Array.from(new Set(allValidPeriods))
      setReturnAvailablePeriods(unique)
    }
    fetchPromoterInv()
  }, [exchangePromoterId, exchangePeriod, supabase])

  useEffect(() => {
    async function fetchResellerInv() {
      if (!exchangeResellerId || !returnPeriod) {
        setExchangeResellerInventory([])
        setExchangeResellerKits([])
        return
      }

      const pQ = returnPeriod === 'null' ? null : returnPeriod

      let invQ = supabase
        .from('reseller_inventory')
        .select('*, products(name, sku)')
        .eq('reseller_id', exchangeResellerId)
        
      if (pQ) invQ = invQ.eq('period', pQ)
      else invQ = invQ.is('period', null)
      
      const { data: loose } = await invQ
      
      setExchangeResellerInventory(loose || [])

      let kitQ = supabase
        .from('promoter_kits')
        .select('*, items:promoter_kit_items(*, products(name, sku))')
        .eq('reseller_id', exchangeResellerId)
        
      if (pQ) kitQ = kitQ.eq('period', pQ)
      else kitQ = kitQ.is('period', null)
        
      const { data: kits } = await kitQ

      const filteredKits = (kits || []).filter(k => !k.name?.includes('[FINALIZADO]') && !k.name?.includes('[ACERTADO]'))
      setExchangeResellerKits(filteredKits)
    }
    fetchResellerInv()
  }, [exchangeResellerId, returnPeriod, supabase])

  // Check max quantity based on mode (Geral vs Promotor)
  useEffect(() => {
    async function checkMax() {
      if (!selectedProductId || !selectedColor || !selectedSize) {
        setMaxQuantity(0)
        setAvailablePeriods([])
        return
      }

      // Geral (Retail, Wholesale, Exchange)
      const { data } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', selectedProductId)
        .eq('color', selectedColor)
        .eq('size', selectedSize)
        .single()
      setMaxQuantity(data?.quantity || 0)
    }
    checkMax()
  }, [selectedProductId, selectedColor, selectedSize, mode, selectedPromoterId, selectedPeriod])

  
  
  const addReturnToCart = () => {
    if (!returnProductId || !returnColor || !returnSize || returnQuantity <= 0) {
      alert("Preencha todos os campos do produto devolvido corretamente.");
      return;
    }
    const alreadyExists = returnCartItems.some(item => item.productId === returnProductId && item.color === returnColor && item.size === returnSize);
    if (alreadyExists) {
      alert("Esta peça já foi adicionada. Caso queira alterar a quantidade, remova a peça e adicione novamente.");
      return;
    }

    const item = {
      id: Date.now().toString(),
      productId: returnProductId,
      productObj: products.find(p => p.id === returnProductId) || (exchangeSourceType === 'OUT_PROMOTER' ? [...exchangePromoterInventory, ...exchangeResellerInventory, ...exchangeResellerKits.flatMap(k => k.items)].find((i:any) => i.product_id === returnProductId)?.products : null),
      color: returnColor,
      size: returnSize,
      quantity: returnQuantity,
      period: returnPeriod,
      kitId: exchangeKitId || undefined
    };
    setReturnCartItems([...returnCartItems, item]);
    setReturnProductId("");
    setReturnColor("");
    setReturnSize("");
    setReturnQuantity(1);
    setSelectedTransactionId("");
  };

  const removeReturnFromCart = (id: string) => {
    setReturnCartItems(returnCartItems.filter(item => item.id !== id));
  };

  const addToCart = () => {
    if (!selectedProductId || !selectedColor || !selectedSize || quantity <= 0) {
      alert("Preencha todos os campos do produto corretamente.");
      return;
    }
    if (quantity > maxQuantity) {
      alert("Quantidade maior que o estoque disponível.");
      return;
    }

    const alreadyExists = cartItems.some(item => item.productId === selectedProductId && item.color === selectedColor && item.size === selectedSize);
    if (alreadyExists) {
      alert("Esta peça já foi adicionada. Caso queira alterar a quantidade, remova a peça e adicione novamente.");
      return;
    }

    const item = {
      id: Date.now().toString(),
      productId: selectedProductId,
      productObj: products.find(p => p.id === selectedProductId),
      color: selectedColor,
      size: selectedSize,
      quantity: quantity,
      promoterId: selectedPromoterId,
      period: selectedPeriod
    };

    setCartItems([...cartItems, item]);

    // Reset product selection
    setSelectedProductId("");
    setSelectedColor("");
    setSelectedSize("");
    setSelectedPeriod("");
    setQuantity(1);
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    
    if (!selectedClient && !isConsumerSale && !(mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER')) {
      alert("Por favor, selecione um cliente cadastrado.")
      setSubmitting(false)
      return
    }
    e.preventDefault()
    setSubmitting(true)
    


    if (mode === 'EXCHANGE' && selectedTransactionId && isExpired) {
      alert("Esta venda expirou o prazo de troca.")
      setSubmitting(false)
      return
    }

    let clientName = isConsumerSale ? "" : (clients.find(c => c.id === selectedClient)?.nome || selectedClient)
    if (mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER') {
        const pName = promoters.find(p => p.id === exchangePromoterId)?.nome || ''
        clientName = `Promotor(a) ${pName}`
    }
    
    let txNotes = `Venda #${nextSaleId}`
    if (clientName) {
      txNotes += ` | Cliente: ${clientName}`
    }
    if (notes) {
      txNotes += ` | Obs: ${notes}`
    }

    try {
      if (mode !== 'EXCHANGE') {
        if (cartItems.length === 0) {
          alert("Adicione pelo menos um item à venda.");
          setSubmitting(false);
          return;
        }

        for (const item of cartItems) {
          const { data: inv } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
          if (inv) {
            await supabase.from('inventory').update({ quantity: inv.quantity - item.quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
            await supabase.from('inventory_transactions').insert({
              created_by: (await supabase.auth.getSession()).data.session?.user?.id,
              type: mode === 'RETAIL' ? 'OUT_RETAIL' : 'OUT_WHOLESALE', product_id: item.productId, size: item.size, color: item.color, quantity: -item.quantity, notes: txNotes, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
            })
          }
        }
      } else if (mode === 'EXCHANGE') {
        if (cartItems.length === 0 && returnCartItems.length === 0) {
          alert("Adicione peças para troca/devolução.");
          setSubmitting(false);
          return;
        }

        // Loop das peças que estão SAINDO (cartItems)
        for (const item of cartItems) {
          if (exchangeSourceType === 'OUT_PROMOTER') {
            const pQ = item.period === 'null' ? null : item.period;
            
            // 1. Remove new piece from general inventory
            const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
            if (invOut) {
              await supabase.from('inventory').update({ quantity: invOut.quantity - item.quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
              await supabase.from('inventory_transactions').insert({
                created_by: (await supabase.auth.getSession()).data.session?.user?.id,
                type: 'EXCHANGE_OUT', product_id: item.productId, size: item.size, color: item.color, quantity: -item.quantity, notes: txNotes + " (Saída para Troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
              })
            }

            // 2. Add new piece to promoter/reseller destination
            if (!exchangeResellerId) {
              let promOutQuery = supabase.from('promoter_inventory').select('*').eq('promoter_id', exchangePromoterId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
              if (pQ) promOutQuery = promOutQuery.eq('period', pQ)
              else promOutQuery = promOutQuery.is('period', null)
              
              const { data: promInvOut } = await promOutQuery.maybeSingle()
              if (promInvOut) {
                await supabase.from('promoter_inventory').update({ quantity: promInvOut.quantity + item.quantity, updated_at: new Date().toISOString() }).eq('id', promInvOut.id)
              } else {
                await supabase.from('promoter_inventory').insert({
                  promoter_id: exchangePromoterId, product_id: item.productId, color: item.color, size: item.size, quantity: item.quantity, period: pQ
                })
              }
            } else {
              if (exchangeKitId) {
                const { data: kitItem } = await supabase.from('promoter_kit_items')
                  .select('*').eq('kit_id', exchangeKitId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size).maybeSingle()
                if (kitItem) {
                  await supabase.from('promoter_kit_items').update({ quantity: kitItem.quantity + item.quantity }).eq('id', kitItem.id)
                } else {
                  await supabase.from('promoter_kit_items').insert({ kit_id: exchangeKitId, product_id: item.productId, color: item.color, size: item.size, quantity: item.quantity })
                }
                const { data: outProd } = await supabase.from('products').select('price').eq('id', item.productId).maybeSingle()
                const { data: kit } = await supabase.from('promoter_kits').select('total_price').eq('id', exchangeKitId).maybeSingle()
                if (outProd && kit) {
                  await supabase.from('promoter_kits').update({ total_price: Number(kit.total_price) + (Number(outProd.price) * item.quantity) }).eq('id', exchangeKitId)
                }
              } else {
                let resOutQuery = supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
                if (pQ) resOutQuery = resOutQuery.eq('period', pQ)
                else resOutQuery = resOutQuery.is('period', null)
                
                const { data: resInvOut } = await resOutQuery.maybeSingle()
                if (resInvOut) {
                  await supabase.from('reseller_inventory').update({ quantity: resInvOut.quantity + item.quantity, updated_at: new Date().toISOString() }).eq('id', resInvOut.id)
                } else {
                  await supabase.from('reseller_inventory').insert({
                    reseller_id: exchangeResellerId, product_id: item.productId, color: item.color, size: item.size, quantity: item.quantity, period: pQ
                  })
                }
              }
            }
          } else {
            // RETAIL / WHOLESALE
            const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
            if (invOut) {
              await supabase.from('inventory').update({ quantity: invOut.quantity - item.quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
              await supabase.from('inventory_transactions').insert({
                created_by: (await supabase.auth.getSession()).data.session?.user?.id,
                type: 'EXCHANGE_OUT', product_id: item.productId, size: item.size, color: item.color, quantity: -item.quantity, notes: txNotes + " (Saída por troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
              })
            }
          }
        }

        // Loop das peças que estão ENTRANDO (returnCartItems)
        for (const item of returnCartItems) {
          if (exchangeSourceType === 'OUT_PROMOTER') {
            const pQ = item.period === 'null' ? null : item.period;

            // Remove from source
            if (!exchangeResellerId) {
              let promInQuery = supabase.from('promoter_inventory').select('*').eq('promoter_id', exchangePromoterId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
              if (pQ) promInQuery = promInQuery.eq('period', pQ)
              else promInQuery = promInQuery.is('period', null)
              
              const { data: promInvIn } = await promInQuery.maybeSingle()
              if (promInvIn) {
                const newQ = promInvIn.quantity - item.quantity
                if (newQ <= 0) {
                  await supabase.from('promoter_inventory').delete().eq('id', promInvIn.id)
                } else {
                  await supabase.from('promoter_inventory').update({ quantity: newQ, updated_at: new Date().toISOString() }).eq('id', promInvIn.id)
                }
              }
            } else {
              if (item.kitId) {
                const { data: kitItem } = await supabase.from('promoter_kit_items')
                  .select('*')
                  .eq('kit_id', item.kitId)
                  .eq('product_id', item.productId)
                  .eq('color', item.color)
                  .eq('size', item.size)
                  .maybeSingle()
                if (kitItem) {
                  const newQ = kitItem.quantity - item.quantity
                  if (newQ <= 0) {
                    await supabase.from('promoter_kit_items').delete().eq('id', kitItem.id)
                  } else {
                    await supabase.from('promoter_kit_items').update({ quantity: newQ }).eq('id', kitItem.id)
                  }
                  const { data: inProd } = await supabase.from('products').select('price').eq('id', item.productId).maybeSingle()
                  const { data: kit } = await supabase.from('promoter_kits').select('total_price').eq('id', item.kitId).maybeSingle()
                  if (inProd && kit) {
                    await supabase.from('promoter_kits').update({
                      total_price: Number(kit.total_price) - (Number(inProd.price) * item.quantity)
                    }).eq('id', item.kitId)
                  }
                }
              } else {
                let resInQuery = supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
                if (pQ) resInQuery = resInQuery.eq('period', pQ)
                else resInQuery = resInQuery.is('period', null)
                
                const { data: resInvIn } = await resInQuery.maybeSingle()
                if (resInvIn) {
                  const newQ = resInvIn.quantity - item.quantity
                  if (newQ <= 0) {
                    await supabase.from('reseller_inventory').delete().eq('id', resInvIn.id)
                  } else {
                    await supabase.from('reseller_inventory').update({ quantity: newQ, updated_at: new Date().toISOString() }).eq('id', resInvIn.id)
                  }
                }
              }
            }
          }

          // Add to general inventory (all EXCHANGE sources)
          const { data: invIn } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
          if (invIn) {
            await supabase.from('inventory').update({ quantity: invIn.quantity + item.quantity, updated_at: new Date().toISOString() }).eq('id', invIn.id)
          } else {
            await supabase.from('inventory').insert({
              product_id: item.productId, size: item.size, color: item.color, quantity: item.quantity
            })
          }
          await supabase.from('inventory_transactions').insert({
            created_by: (await supabase.auth.getSession()).data.session?.user?.id,
            type: 'EXCHANGE_IN', product_id: item.productId, size: item.size, color: item.color, quantity: item.quantity, notes: txNotes + " (Entrada de Troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })
        }
      }

      alert("Transação registrada com sucesso!")
      
      // Reset
      setSelectedProductId("")
      setSelectedColor("")
      setSelectedSize("")
      setSelectedPeriod("")
      setReturnProductId("")
      setReturnColor("")
      setReturnSize("")
      setReturnPeriod("")
      setQuantity(1)
      setNotes("")
      setCartItems([])
      setReturnCartItems([])
      
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar venda.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleModeChange = (newMode: 'RETAIL' | 'WHOLESALE' | 'EXCHANGE') => {
    setMode(newMode);
    // Reset all form fields when changing tabs
    setSelectedProductId("");
    setSelectedColor("");
    setSelectedSize("");
    setSelectedPeriod("");
    setReturnProductId("");
    setReturnColor("");
    setReturnSize("");
    setReturnPeriod("");
    setQuantity(1);
    setNotes("");
    setCartItems([]);
    setExchangePeriod("");
    setExchangeSourceType("");
    setSelectedTransactionId("");
    setExchangePromoterId("");
    setExchangeResellerId("");
    setSelectedPromoterId("");
  }

  const selectedProductObj = products.find(p => p.id === selectedProductId)
  const returnProductObj = products.find(p => p.id === returnProductId)

  const selectedTx = recentTransactions.find(t => t.id === selectedTransactionId);
  let isExpired = false;
  let expiredMessage = "";

  if (selectedTx) {
    const exchangeDate = new Date(transactionDate + 'T12:00:00Z');
    const originalDate = new Date(selectedTx.created_at);
    const diffTime = exchangeDate.getTime() - originalDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (selectedTx.type === 'OUT_RETAIL' && diffDays > 38) {
      isExpired = true;
      expiredMessage = `Esta venda de Varejo ocorreu há mais de 38 dias (${diffDays} dias atrás). O prazo para troca expirou.`;
    } else if (selectedTx.type === 'OUT_WHOLESALE' && diffDays > 30) {
      isExpired = true;
      expiredMessage = `Esta venda de Atacado ocorreu há mais de 30 dias (${diffDays} dias atrás). O prazo para troca expirou.`;
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>
  )

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              PDV / Vendas
            </h1>
          </div>
          <p className="text-slate-500">Registre saídas e trocas para dar baixa no estoque automaticamente.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="flex border-b border-slate-100 p-4 gap-2 overflow-x-auto">
            <button onClick={() => handleModeChange('RETAIL')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'RETAIL' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <Tag className="w-4 h-4 mr-2" /> Venda Varejo
            </button>
            <button onClick={() => handleModeChange('WHOLESALE')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'WHOLESALE' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <Box className="w-4 h-4 mr-2" /> Venda Atacado
            </button>

            <button onClick={() => handleModeChange('EXCHANGE')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'EXCHANGE' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <RefreshCw className="w-4 h-4 mr-2" /> Troca / Devolução
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            


            {mode === 'EXCHANGE' && (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6 space-y-4">
                <h3 className="font-bold text-amber-900 flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Venda Original (O que está voltando)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50">
                    <input type="radio" name="exchangeSource" value="OUT_RETAIL" checked={exchangeSourceType === 'OUT_RETAIL'} onChange={() => {setExchangeSourceType('OUT_RETAIL'); setSelectedTransactionId('')}} className="text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm font-medium">Troca do Varejo</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50">
                    <input type="radio" name="exchangeSource" value="OUT_WHOLESALE" checked={exchangeSourceType === 'OUT_WHOLESALE'} onChange={() => {setExchangeSourceType('OUT_WHOLESALE'); setSelectedTransactionId('')}} className="text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm font-medium">Troca do Atacado</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50">
                    <input type="radio" name="exchangeSource" value="OUT_PROMOTER" checked={exchangeSourceType === 'OUT_PROMOTER'} onChange={() => {setExchangeSourceType('OUT_PROMOTER'); setSelectedTransactionId('')}} className="text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm font-medium">Troca do Consignado</span>
                  </label>
                </div>

                {exchangeSourceType && exchangeSourceType !== 'OUT_PROMOTER' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Selecione a Venda *</label>
                    <Popover open={txComboboxOpen} onOpenChange={setTxComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={txComboboxOpen}
                          className="w-full justify-between bg-white border border-amber-200 rounded-xl px-4 h-[46px] font-normal text-sm hover:bg-slate-50 focus:border-amber-400"
                        >
                          {selectedTransactionId
                            ? (() => {
                                const t = recentTransactions.find((tx) => tx.id === selectedTransactionId)
                                if (!t) return "Selecione a venda anterior..."
                                const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR')
                                const promoterName = t.promoter_id ? promoters.find(p => p.id === t.promoter_id)?.nome : ''
                                return `${dateStr} - ${t.products?.name} - ${Math.abs(t.quantity)} un ${t.notes ? `(${t.notes.split(' | ')[0]})` : ''}`
                              })()
                            : "Selecione a venda anterior..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Pesquisar por cliente, CPF, nº da venda ou produto..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma venda encontrada.</CommandEmpty>
                            <CommandGroup>
                              {recentTransactions.filter(t => t.type === exchangeSourceType).map(t => {
                                const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR')
                                const promoterName = t.promoter_id ? promoters.find(p => p.id === t.promoter_id)?.nome : ''
                                
                                // Extract client name to find CPF
                                let cpf = ""
                                if (t.notes && t.notes.includes('Cliente: ')) {
                                  const cName = t.notes.split(' | ')[0].replace('Cliente: ', '').trim()
                                  const foundClient = clients.find(c => c.nome === cName) || promoters.find(p => p.nome === cName)
                                  if (foundClient && foundClient.cpf) {
                                    cpf = foundClient.cpf
                                  }
                                }

                                const searchString = `${dateStr} ${t.products?.name} ${t.color} ${t.size} ${promoterName} ${t.notes || ''} ${cpf} ${t.id}`
                                const label = `${dateStr} - ${t.products?.name} (${t.color} ${t.size}) - ${Math.abs(t.quantity)} un ${promoterName ? `- ${promoterName}` : ''} ${t.notes ? ` | ${t.notes.split(' | ')[0]}` : ''}`

                                return (
                                  <CommandItem
                                    key={t.id}
                                    value={searchString}
                                    onSelect={() => {
                                      setSelectedTransactionId(t.id)
                                      setTxComboboxOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTransactionId === t.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {label}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {isExpired && (
                      <div className="mt-3 p-4 bg-red-100 text-red-800 rounded-xl text-sm font-medium border border-red-200">
                        {expiredMessage}
                      </div>
                    )}
                  </div>
                )}

                {exchangeSourceType === 'OUT_PROMOTER' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <p className="text-xs text-amber-700 bg-amber-100 p-3 rounded-xl">
                        Atenção: A troca do consignado irá retirar a peça retornada do promotor, e adicionar a nova peça no promotor, dentro do período especificado.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Promotor *</label>
                      <select required value={exchangePromoterId} onChange={(e) => {setExchangePromoterId(e.target.value); setExchangeResellerId(''); setReturnProductId('');}} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm">
                        <option value="" disabled>Selecione o promotor...</option>
                        {promoters.map(p => (
                          <option key={p.id} value={p.id}>{p.nome || p.firstName || p.email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Período da Troca *</label>
                      <SearchableSelect
                        options={returnAvailablePeriods.map(p => ({
                          value: p,
                          label: p === 'null' ? 'Período Padrão' : p
                        }))}
                        value={returnPeriod}
                        onChange={(val) => setReturnPeriod(val)}
                        placeholder="Selecione o período..."
                        emptyMessage="Nenhum período encontrado"
                      />
                    </div>
                  </div>
                )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade Devolvida *</label>
                      <input type="number" min="1" disabled={!!selectedTransactionId && mode === 'EXCHANGE'} value={returnQuantity} onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm" />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button type="button" onClick={addReturnToCart} className="w-full bg-white hover:bg-amber-50 border border-amber-400 text-amber-600 rounded-xl py-3 font-bold text-sm shadow-sm transition-all">
                      + Adicionar Peça Devolvida
                    </Button>
                  </div>
                  
                  {returnCartItems.length > 0 && (
                    <div className="mt-6 bg-white border border-amber-200 rounded-xl p-4">
                      <h3 className="font-bold text-amber-800 mb-3">Itens Sendo Devolvidos ({returnCartItems.length})</h3>
                      <div className="space-y-2">
                        {returnCartItems.map((item:any) => (
                          <div key={item.id} className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{item.productObj?.name || 'Produto'}</p>
                              <p className="text-xs text-slate-500">Cor: {item.color} | Tamanho: {item.size} | Qtd: {item.quantity}</p>
                            </div>
                            <button type="button" onClick={() => removeReturnFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2 flex items-center text-xs font-medium">
                              <Trash2 className="w-4 h-4 mr-1" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                {exchangeSourceType === 'OUT_PROMOTER' && exchangePromoterId && (
                  <div className="mb-4 pt-2 border-t border-amber-200/50">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Revendedora (Opcional)</label>
                    <select
                      value={exchangeResellerId}
                      onChange={(e) => {
                        setExchangeResellerId(e.target.value)
                        setReturnProductId('')
                        setExchangeKitId('')
                      }}
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm mb-3"
                    >
                      <option value="">Sem revendedora (Troca do promotor)</option>
                      {resellers.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>

                    {exchangeResellerId && (
                      <div className="mb-4 pt-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Kit *</label>
                        <select
                          required={returnCartItems.length === 0}
                          value={exchangeKitId}
                          onChange={(e) => {
                            setExchangeKitId(e.target.value)
                            setReturnProductId('')
                          }}
                          className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm"
                        >
                          <option value="" disabled>Selecione um kit...</option>
                          {exchangeResellerKits.map(k => (
                            <option key={k.id} value={k.id}>{k.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-amber-200/50">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produto que está voltando *</label>
                  {exchangeSourceType === 'OUT_PROMOTER' ? (
                    <select required={returnCartItems.length === 0} disabled={exchangeSourceType === 'OUT_PROMOTER' ? !exchangePromoterId : !!selectedTransactionId} value={returnProductId ? `${returnProductId}|${returnColor}|${returnSize}` : ""} onChange={(e) => { 
                      const [pId, c, s] = e.target.value.split('|');
                      setReturnProductId(pId);
                      setReturnColor(c);
                      setReturnSize(s);
                    }} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-50 disabled:bg-slate-100">
                      <option value="" disabled>Selecione a peça...</option>
                      {(!exchangeResellerId ? exchangePromoterInventory : (exchangeResellerKits.find(k => k.id === exchangeKitId)?.items || [])).map((inv: any) => (
                        <option key={inv.id} value={`${inv.product_id}|${inv.color}|${inv.size}`}>
                          {inv.products?.sku ? `[${inv.products?.sku}] ` : ''}{inv.products?.name} ({inv.color} {inv.size}) - Saldo: {inv.quantity} un
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select required={returnCartItems.length === 0} disabled={!!selectedTransactionId} value={returnProductId} onChange={(e) => { setReturnProductId(e.target.value); setReturnColor(""); setReturnSize("") }} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                      <option value="" disabled>Selecione...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>)}
                    </select>
                  )}
                </div>
                
                {exchangeSourceType !== 'OUT_PROMOTER' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cor *</label>
                      <select required={returnCartItems.length === 0} disabled={!!selectedTransactionId || !returnProductId} value={returnColor} onChange={(e) => setReturnColor(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                        <option value="" disabled>Selecione...</option>
                        {returnProductObj?.colors?.map((c:any, i:number) => <option key={i} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho *</label>
                      <select required={returnCartItems.length === 0} disabled={!!selectedTransactionId || !returnProductId} value={returnSize} onChange={(e) => setReturnSize(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                        <option value="" disabled>Selecione...</option>
                        {returnProductObj?.sizes?.map((s:any, i:number) => <option key={i} value={s}>{s}</option>) || ["P","M","G","GG"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                {mode === 'EXCHANGE' ? <><ShoppingCart className="w-4 h-4 mr-2" /> Peça que ESTÁ SAINDO (Sendo levada pelo cliente)</> : 'Detalhes do Produto Vendido'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produto *</label>
                  <Popover open={prodComboboxOpen} onOpenChange={setProdComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={prodComboboxOpen}
                        className="w-full justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 h-[46px] font-normal text-sm hover:bg-slate-100"
                      >
                        {selectedProductId
                          ? (() => {
                              const p = products.find(prod => prod.id === selectedProductId);
                              return p ? `${p.sku ? `[${p.sku}] ` : ''}${p.name}` : "Selecione o produto...";
                            })()
                          : "Selecione o produto..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] md:w-[600px] lg:w-[800px] max-h-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar por SKU, Nome, Cor ou Tamanho..." />
                        <CommandList className="max-h-[250px]">
                          <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                          <CommandGroup>
                            {products.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={`${p.sku || ""} ${p.name} ${Array.isArray(p.colors) ? p.colors.join(' ') : (p.colors || '')} ${Array.isArray(p.sizes) ? p.sizes.join(' ') : (p.sizes || '')}`}
                                onSelect={() => {
                                  setSelectedProductId(p.id);
                                  setSelectedColor("");
                                  setSelectedSize("");
                                  setProdComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProductId === p.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {p.sku ? <span className="text-brand-plum font-medium mr-2">[{p.sku}]</span> : null}
                                <span>{p.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cor *</label>
                    <select
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      disabled={!selectedProductId}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                    >
                      <option value="" disabled>Selecione...</option>
                      {selectedProductObj?.colors?.map((c: any, i: number) => <option key={i} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho *</label>
                    <select
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      disabled={!selectedProductId}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                    >
                      <option value="" disabled>Selecione...</option>
                      {selectedProductObj?.sizes?.map((s: string, i: number) => <option key={i} value={s}>{s}</option>) || ["P","M","G","GG"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {(selectedProductId && selectedColor && selectedSize) && (
                  <div className={`p-4 rounded-xl text-sm ${maxQuantity > 0 ? 'bg-blue-50 border border-blue-100 text-blue-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
                    Estoque atual geral: <strong>{maxQuantity} unidades</strong>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data da Transação *</label>
                    <input
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade *</label>
                    <input
                      type="number"
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      disabled={maxQuantity === 0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                    />
                    
                    
                  </div>
                </div>
                
                {!(mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER') && (
                <>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="isConsumer"
                    checked={isConsumerSale}
                    onChange={(e) => {
                      setIsConsumerSale(e.target.checked)
                      if (e.target.checked) setSelectedClient("")
                    }}
                    className="w-4 h-4 text-brand-plum rounded focus:ring-brand-plum"
                  />
                  <label htmlFor="isConsumer" className="text-sm font-medium text-slate-700">
                    Venda sem cadastro (Venda #{nextSaleId})
                  </label>
                </div>
                {!isConsumerSale && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente Registrado *</label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 h-[46px] font-normal text-sm hover:bg-slate-100"
                      >
                        {selectedClient
                          ? clients.find((client) => client.id === selectedClient)?.nome
                          : "Pesquise e selecione..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar pessoa..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={`${client.nome} ${client.id}`}
                                onSelect={() => {
                                  setSelectedClient(client.id)
                                  setComboboxOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedClient === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {client.nome} <span className="ml-2 text-xs text-slate-400">({client.role})</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                )}
                </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações Adicionais (Opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  />
                </div>

              </div>
            </div>

            {/* always show cart for all modes */}
            <div className="pt-6 border-t border-slate-100">
              <Button type="button" onClick={addToCart} disabled={maxQuantity === 0} className="w-full bg-white hover:bg-slate-50 border border-brand-plum text-brand-plum rounded-xl py-4 font-bold text-md shadow-sm transition-all mb-4">
                + Adicionar Peça
              </Button>
            </div>
            
            {cartItems.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-slate-800 mb-3">Itens na Venda ({cartItems.length})</h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.productObj?.name || 'Produto'}</p>
                        <p className="text-xs text-slate-500">Cor: {item.color} | Tamanho: {item.size} | Qtd: {item.quantity}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2 flex items-center text-xs font-medium">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`pt-6 flex justify-end ${mode === 'EXCHANGE' ? 'border-t border-slate-100' : ''}`}>
              <Button type="submit" disabled={submitting || (mode === 'EXCHANGE' ? (cartItems.length === 0 && returnCartItems.length === 0) : cartItems.length === 0)} className="bg-brand-plum hover:bg-brand-rose text-white rounded-xl px-8 h-12 text-base font-bold shadow-md hover:shadow-lg transition-all w-full md:w-auto">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'EXCHANGE' ? 'Registrar Troca' : 'Finalizar Venda')}
              </Button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  )
}
