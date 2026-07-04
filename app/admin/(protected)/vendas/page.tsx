"use client"

import { Button } from "@/components/ui/button"
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
  const [mode, setMode] = useState<'RETAIL' | 'WHOLESALE' | 'PROMOTER_SALE' | 'EXCHANGE'>('RETAIL')
  
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [comboboxOpen, setComboboxOpen] = useState(false)
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
  const [exchangeResellerSourceType, setExchangeResellerSourceType] = useState<'LOOSE' | 'KIT'>('LOOSE')
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
  const [nextConsumerId, setNextConsumerId] = useState(1)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [prodRes, transRes, reselRes, consultRes, consumerTxRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, colors, sizes'),
        supabase.from('inventory_transactions').select('*, products(id, name, sku)').in('type', ['OUT_RETAIL', 'OUT_WHOLESALE']).order('created_at', { ascending: false }).limit(200),
        supabase.from('resellers').select('*').order('name'),
        supabase.from('consultant').select('*').order('name'),
        supabase.from('inventory_transactions').select('notes').ilike('notes', '%Consumidor #%')
      ])

      if (consumerTxRes && consumerTxRes.data) {
        let maxId = 0;
        consumerTxRes.data.forEach((tx) => {
          const match = tx.notes?.match(/Consumidor #(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxId) maxId = num;
          }
        });
        setNextConsumerId(maxId + 1);
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        let currentRole = ""
        if (session) {
          setCurrentUser(session.user)
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
          currentRole = profile?.role || session.user.user_metadata?.role || ""
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
      
      const { data: allInv } = await supabase.from('promoter_inventory').select('period').eq('promoter_id', exchangePromoterId)
      if (allInv) {
        const unique = Array.from(new Set(allInv.map(i => i.period || 'null')))
        setReturnAvailablePeriods(unique)
      }
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

      const { data: loose } = await supabase
        .from('reseller_inventory')
        .select('*, products(name, sku)')
        .eq('reseller_id', exchangeResellerId)
        .is('period', pQ ? undefined : null)
      
      let invQuery = loose
      if (pQ) invQuery = loose?.filter((l: any) => l.period === pQ) || []
      
      setExchangeResellerInventory(invQuery || [])

      const { data: kits } = await supabase
        .from('promoter_kits')
        .select('*, items:promoter_kit_items(*, products(name, sku))')
        .eq('reseller_id', exchangeResellerId)
        .is('period', pQ ? undefined : null)
        
      let kitQuery = kits
      if (pQ) kitQuery = kits?.filter((k: any) => k.period === pQ) || []

      setExchangeResellerKits(kitQuery || [])
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

      if (mode === 'PROMOTER_SALE') {
        if (!selectedPromoterId) {
          setMaxQuantity(0)
          setAvailablePeriods([])
          return
        }
        
        const { data } = await supabase
          .from('promoter_inventory')
          .select('id, quantity, period')
          .eq('product_id', selectedProductId)
          .eq('color', selectedColor)
          .eq('size', selectedSize)
          .eq('promoter_id', selectedPromoterId)
          
        if (data && data.length > 0) {
          setAvailablePeriods(data)
          // Se houver apenas 1, já podemos usar
          if (data.length === 1 && !selectedPeriod) {
            setSelectedPeriod(data[0].period || 'null')
            setMaxQuantity(data[0].quantity)
          } else {
            const sel = data.find(d => (d.period || 'null') === selectedPeriod)
            setMaxQuantity(sel ? sel.quantity : 0)
          }
        } else {
          setAvailablePeriods([])
          setMaxQuantity(0)
        }
      } else {
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
    }
    checkMax()
  }, [selectedProductId, selectedColor, selectedSize, mode, selectedPromoterId, selectedPeriod])

  
  const addToCart = () => {
    if (!selectedProductId || !selectedColor || !selectedSize || quantity <= 0) {
      alert("Preencha todos os campos do produto corretamente.");
      return;
    }
    if (quantity > maxQuantity) {
      alert("Quantidade maior que o estoque disponível.");
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
    
    if (mode === 'EXCHANGE' && (quantity <= 0 || quantity > maxQuantity)) {
      alert("Quantidade inválida ou maior que o estoque.")
      setSubmitting(false)
      return
    }

    if (mode === 'EXCHANGE' && selectedTransactionId && isExpired) {
      alert("Esta venda expirou o prazo de troca.")
      setSubmitting(false)
      return
    }

    let clientName = isConsumerSale ? `Consumidor #${nextConsumerId}` : (clients.find(c => c.id === selectedClient)?.nome || selectedClient)
    if (mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER') {
        const pName = promoters.find(p => p.id === exchangePromoterId)?.nome || ''
        clientName = `Promotor(a) ${pName}`
    }
    const txNotes = `Cliente: ${clientName}${notes ? ` | Obs: ${notes}` : ''}`

    try {
      if (mode !== 'EXCHANGE') {
        if (cartItems.length === 0) {
          alert("Adicione pelo menos um item à venda.");
          setSubmitting(false);
          return;
        }

        for (const item of cartItems) {
          if (mode === 'PROMOTER_SALE') {
            let query = supabase
              .from('promoter_inventory')
              .select('id, quantity')
              .eq('promoter_id', item.promoterId)
              .eq('product_id', item.productId)
              .eq('size', item.size)
              .eq('color', item.color)
              
            if (item.period && item.period !== 'null') {
              query = query.eq('period', item.period)
            } else {
              query = query.is('period', null)
            }
            
            const { data: inv } = await query.single()
              
            if (inv) {
              await supabase.from('promoter_inventory').update({ quantity: inv.quantity - item.quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
              await supabase.from('inventory_transactions').insert({
                type: 'OUT_PROMOTER', product_id: item.productId, size: item.size, color: item.color, quantity: -item.quantity, promoter_id: item.promoterId, notes: txNotes, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
              })
            }
          } else {
            const { data: inv } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
            if (inv) {
              await supabase.from('inventory').update({ quantity: inv.quantity - item.quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
              await supabase.from('inventory_transactions').insert({
                type: mode === 'RETAIL' ? 'OUT_RETAIL' : 'OUT_WHOLESALE', product_id: item.productId, size: item.size, color: item.color, quantity: -item.quantity, notes: txNotes, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
              })
            }
          }
        }
      } else if (mode === 'EXCHANGE') {
        if (exchangeSourceType === 'OUT_PROMOTER') {
          const pQ = returnPeriod === 'null' ? null : returnPeriod

          // 1. New Piece: Remove from general inventory
          const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).maybeSingle()
          if (invOut) {
            await supabase.from('inventory').update({ quantity: invOut.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
            await supabase.from('inventory_transactions').insert({
              type: 'EXCHANGE_OUT', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: txNotes + " (Saída para Troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
            })
          }

          // Add new piece to appropriate destination
          if (!exchangeResellerId) {
            // Add to promoter_inventory
            let promOutQuery = supabase.from('promoter_inventory').select('*').eq('promoter_id', exchangePromoterId).eq('product_id', selectedProductId).eq('color', selectedColor).eq('size', selectedSize)
            if (pQ) promOutQuery = promOutQuery.eq('period', pQ)
            else promOutQuery = promOutQuery.is('period', null)
            
            const { data: promInvOut } = await promOutQuery.maybeSingle()
            if (promInvOut) {
              await supabase.from('promoter_inventory').update({ quantity: promInvOut.quantity + quantity, updated_at: new Date().toISOString() }).eq('id', promInvOut.id)
            } else {
              await supabase.from('promoter_inventory').insert({
                promoter_id: exchangePromoterId, product_id: selectedProductId, color: selectedColor, size: selectedSize, quantity: quantity, period: pQ
              })
            }
          } else {
            if (exchangeResellerSourceType === 'KIT' && exchangeKitId) {
              // Add to kit items
              const { data: kitItem } = await supabase.from('promoter_kit_items')
                .select('*')
                .eq('kit_id', exchangeKitId)
                .eq('product_id', selectedProductId)
                .eq('color', selectedColor)
                .eq('size', selectedSize)
                .single()
                
              if (kitItem) {
                await supabase.from('promoter_kit_items').update({ quantity: kitItem.quantity + quantity }).eq('id', kitItem.id)
              } else {
                await supabase.from('promoter_kit_items').insert({
                  kit_id: exchangeKitId, product_id: selectedProductId, color: selectedColor, size: selectedSize, quantity: quantity
                })
              }
              // Update kit price for new item
              const { data: outProd } = await supabase.from('products').select('price').eq('id', selectedProductId).single()
              const { data: kit } = await supabase.from('promoter_kits').select('total_price').eq('id', exchangeKitId).single()
              if (outProd && kit) {
                await supabase.from('promoter_kits').update({
                  total_price: Number(kit.total_price) + (Number(outProd.price) * quantity)
                }).eq('id', exchangeKitId)
              }
            } else {
              // Add to reseller_inventory
              let resOutQuery = supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', selectedProductId).eq('color', selectedColor).eq('size', selectedSize)
              if (pQ) resOutQuery = resOutQuery.eq('period', pQ)
              else resOutQuery = resOutQuery.is('period', null)
              
              const { data: resInvOut } = await resOutQuery.maybeSingle()
              if (resInvOut) {
                await supabase.from('reseller_inventory').update({ quantity: resInvOut.quantity + quantity, updated_at: new Date().toISOString() }).eq('id', resInvOut.id)
              } else {
                await supabase.from('reseller_inventory').insert({
                  reseller_id: exchangeResellerId, product_id: selectedProductId, color: selectedColor, size: selectedSize, quantity: quantity, period: pQ
                })
              }
            }
          }

          // 2. Returned Piece: Remove from Source, Add to General Inventory

          // Remove from source
          if (!exchangeResellerId) {
            let promInQuery = supabase.from('promoter_inventory').select('*').eq('promoter_id', exchangePromoterId).eq('product_id', returnProductId).eq('color', returnColor).eq('size', returnSize)
            if (pQ) promInQuery = promInQuery.eq('period', pQ)
            else promInQuery = promInQuery.is('period', null)
            
            const { data: promInvIn } = await promInQuery.maybeSingle()
            if (promInvIn) {
              const newQ = promInvIn.quantity - quantity
              if (newQ <= 0) {
                await supabase.from('promoter_inventory').delete().eq('id', promInvIn.id)
              } else {
                await supabase.from('promoter_inventory').update({ quantity: newQ, updated_at: new Date().toISOString() }).eq('id', promInvIn.id)
              }
            }
          } else {
            if (exchangeResellerSourceType === 'KIT' && exchangeKitId) {
              const { data: kitItem } = await supabase.from('promoter_kit_items')
                .select('*')
                .eq('kit_id', exchangeKitId)
                .eq('product_id', returnProductId)
                .eq('color', returnColor)
                .eq('size', returnSize)
                .single()
              if (kitItem) {
                const newQ = kitItem.quantity - quantity
                if (newQ <= 0) {
                  await supabase.from('promoter_kit_items').delete().eq('id', kitItem.id)
                } else {
                  await supabase.from('promoter_kit_items').update({ quantity: newQ }).eq('id', kitItem.id)
                }
                
                // Update kit price for returned item
                const { data: inProd } = await supabase.from('products').select('price').eq('id', returnProductId).single()
                const { data: kit } = await supabase.from('promoter_kits').select('total_price').eq('id', exchangeKitId).single()
                if (inProd && kit) {
                  await supabase.from('promoter_kits').update({
                    total_price: Number(kit.total_price) - (Number(inProd.price) * quantity)
                  }).eq('id', exchangeKitId)
                }
              }
            } else {
              let resInQuery = supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', returnProductId).eq('color', returnColor).eq('size', returnSize)
              if (pQ) resInQuery = resInQuery.eq('period', pQ)
              else resInQuery = resInQuery.is('period', null)
              
              const { data: resInvIn } = await resInQuery.maybeSingle()
              if (resInvIn) {
                const newQ = resInvIn.quantity - quantity
                if (newQ <= 0) {
                  await supabase.from('reseller_inventory').delete().eq('id', resInvIn.id)
                } else {
                  await supabase.from('reseller_inventory').update({ quantity: newQ, updated_at: new Date().toISOString() }).eq('id', resInvIn.id)
                }
              }
            }
          }

          const { data: invIn } = await supabase.from('inventory').select('id, quantity').eq('product_id', returnProductId).eq('size', returnSize).eq('color', returnColor).maybeSingle()
          if (invIn) {
            await supabase.from('inventory').update({ quantity: invIn.quantity + quantity, updated_at: new Date().toISOString() }).eq('id', invIn.id)
          } else {
            await supabase.from('inventory').insert({
              product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity
            })
          }
          await supabase.from('inventory_transactions').insert({
            type: 'EXCHANGE_IN', product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity, notes: txNotes + " (Entrada de Troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })

        } else {
          // 1. Remove new piece from inventory
          const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).maybeSingle()
          if (invOut) {
            await supabase.from('inventory').update({ quantity: invOut.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
            await supabase.from('inventory_transactions').insert({
              type: 'EXCHANGE_OUT', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: txNotes + " (Saída por troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
            })
          }
          
          // 2. Add returned piece to inventory
          const { data: invIn } = await supabase.from('inventory').select('id, quantity').eq('product_id', returnProductId).eq('size', returnSize).eq('color', returnColor).maybeSingle()
          if (invIn) {
            await supabase.from('inventory').update({ quantity: invIn.quantity + quantity, updated_at: new Date().toISOString() }).eq('id', invIn.id)
          } else {
            await supabase.from('inventory').insert({
              product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity
            })
          }
          await supabase.from('inventory_transactions').insert({
            type: 'EXCHANGE_IN', product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity, notes: txNotes + " (Entrada por devolução)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
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
      
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar venda.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleModeChange = (newMode: 'RETAIL' | 'WHOLESALE' | 'PROMOTER_SALE' | 'EXCHANGE') => {
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
            <button onClick={() => handleModeChange('PROMOTER_SALE')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'PROMOTER_SALE' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <ShoppingCart className="w-4 h-4 mr-2" /> Venda do Promotor
            </button>
            <button onClick={() => handleModeChange('EXCHANGE')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'EXCHANGE' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <RefreshCw className="w-4 h-4 mr-2" /> Troca / Devolução
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {mode === 'PROMOTER_SALE' && (
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 mb-6">
                <label className="block text-sm font-bold text-slate-800 mb-2">Quem realizou a venda? *</label>
                <select
                  required
                  value={selectedPromoterId}
                  onChange={(e) => setSelectedPromoterId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >
                  <option value="" disabled>Selecione o Promotor/Revendedora</option>
                  {promoters.map(p => (
                    <option key={p.id} value={p.id}>{p.nome || p.firstName || p.email}</option>
                  ))}
                </select>
                <p className="text-xs text-purple-700 mt-2">Isso vai abater as peças do estoque pessoal deste promotor, não do estoque geral.</p>
              </div>
            )}

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
                                  const foundClient = clients.find(c => c.nome === cName)
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
                      <select
                        required
                        value={returnPeriod}
                        onChange={(e) => setReturnPeriod(e.target.value)}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm"
                      >
                        <option value="" disabled>Selecione o período...</option>
                        {returnAvailablePeriods.map(p => (
                          <option key={p} value={p}>{p === 'null' ? 'Período Padrão' : p}</option>
                        ))}
                      </select>
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
                      <div className="flex gap-4 mb-4">
                        <label className="flex items-center text-sm">
                          <input type="radio" checked={exchangeResellerSourceType === 'LOOSE'} onChange={() => {setExchangeResellerSourceType('LOOSE'); setReturnProductId('');}} className="mr-2" />
                          Peças soltas
                        </label>
                        <label className="flex items-center text-sm">
                          <input type="radio" checked={exchangeResellerSourceType === 'KIT'} onChange={() => {setExchangeResellerSourceType('KIT'); setReturnProductId(''); setExchangeKitId('');}} className="mr-2" />
                          Peças de Kits
                        </label>
                      </div>
                    )}
                    
                    {exchangeResellerId && exchangeResellerSourceType === 'KIT' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Kit *</label>
                        <select
                          required
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
                    <select required disabled={exchangeSourceType === 'OUT_PROMOTER' ? !exchangePromoterId : !!selectedTransactionId} value={returnProductId ? `${returnProductId}|${returnColor}|${returnSize}` : ""} onChange={(e) => { 
                      const [pId, c, s] = e.target.value.split('|');
                      setReturnProductId(pId);
                      setReturnColor(c);
                      setReturnSize(s);
                    }} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-50 disabled:bg-slate-100">
                      <option value="" disabled>Selecione a peça...</option>
                      {(!exchangeResellerId ? exchangePromoterInventory : (exchangeResellerSourceType === 'LOOSE' ? exchangeResellerInventory : exchangeResellerKits.find(k => k.id === exchangeKitId)?.items || [])).map((inv: any) => (
                        <option key={inv.id} value={`${inv.product_id}|${inv.color}|${inv.size}`}>
                          {inv.products?.sku ? `[${inv.products?.sku}] ` : ''}{inv.products?.name} ({inv.color} {inv.size}) - Saldo: {inv.quantity} un
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select required disabled={!!selectedTransactionId} value={returnProductId} onChange={(e) => { setReturnProductId(e.target.value); setReturnColor(""); setReturnSize("") }} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                      <option value="" disabled>Selecione...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>)}
                    </select>
                  )}
                </div>
                
                {exchangeSourceType !== 'OUT_PROMOTER' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cor *</label>
                      <select required disabled={!!selectedTransactionId || !returnProductId} value={returnColor} onChange={(e) => setReturnColor(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                        <option value="" disabled>Selecione...</option>
                        {returnProductObj?.colors?.map((c:any, i:number) => <option key={i} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho *</label>
                      <select required disabled={!!selectedTransactionId || !returnProductId} value={returnSize} onChange={(e) => setReturnSize(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
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
                  <select
                    required={mode === 'EXCHANGE' || cartItems.length === 0}
                    value={selectedProductId}
                    onChange={(e) => { setSelectedProductId(e.target.value); setSelectedColor(""); setSelectedSize("") }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  >
                    <option value="" disabled>Selecione o produto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>)}
                  </select>
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

                {mode === 'PROMOTER_SALE' && availablePeriods.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Período *</label>
                    <select
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                    >
                      <option value="" disabled>Selecione o período...</option>
                      {availablePeriods.map((inv: any) => (
                        <option key={inv.id} value={inv.period || 'null'}>
                          {inv.period || 'Sem Período Registrado'} (Estoque disponível: {inv.quantity} un)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(selectedProductId && selectedColor && selectedSize && (mode !== 'PROMOTER_SALE' || selectedPromoterId)) && (
                  <div className={`p-4 rounded-xl text-sm ${maxQuantity > 0 ? 'bg-blue-50 border border-blue-100 text-blue-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
                    Estoque atual {mode === 'PROMOTER_SALE' ? 'do promotor neste período' : 'geral'}: <strong>{maxQuantity} unidades</strong>
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
                    Venda Consumidor (Venda #{nextConsumerId})
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

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <Button type="submit" disabled={submitting || maxQuantity === 0 || isExpired} className="bg-brand-plum hover:bg-brand-rose text-white rounded-xl px-8 h-12 text-base font-bold shadow-md hover:shadow-lg transition-all w-full md:w-auto">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Registro'}
              </Button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  )
}
