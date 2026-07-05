const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// 1. Add cart state
const stateMatch = `const [maxQuantity, setMaxQuantity] = useState(0)`;
const stateReplace = `const [maxQuantity, setMaxQuantity] = useState(0)

  // Cart state
  const [cartItems, setCartItems] = useState<any[]>([])`;
content = content.replace(stateMatch, stateReplace);

// 2. Add addToCart and removeFromCart functions
const funcMatch = `const handleSubmit = async (e: React.FormEvent) => {`;
const funcReplace = `
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

  const handleSubmit = async (e: React.FormEvent) => {`;
content = content.replace(funcMatch, funcReplace);

// 3. Update handleSubmit logic
const submitLogicMatch = `try {
      if (mode === 'PROMOTER_SALE') {
        // Remove from promoter_inventory
        let query = supabase
          .from('promoter_inventory')
          .select('id, quantity')
          .eq('promoter_id', selectedPromoterId)
          .eq('product_id', selectedProductId)
          .eq('size', selectedSize)
          .eq('color', selectedColor)
          
        if (selectedPeriod && selectedPeriod !== 'null') {
          query = query.eq('period', selectedPeriod)
        } else {
          query = query.is('period', null)
        }
        
        const { data: inv } = await query.single()
          
        if (inv) {
          await supabase.from('promoter_inventory').update({ quantity: inv.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
          await supabase.from('inventory_transactions').insert({
            type: 'OUT_PROMOTER', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, promoter_id: selectedPromoterId, notes: txNotes, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })
        }
      } else if (mode === 'RETAIL' || mode === 'WHOLESALE') {
        // Remove from inventory
        const { data: inv } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).maybeSingle()
        if (inv) {
          await supabase.from('inventory').update({ quantity: inv.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
          await supabase.from('inventory_transactions').insert({
            type: mode === 'RETAIL' ? 'OUT_RETAIL' : 'OUT_WHOLESALE', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: txNotes, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })
        }
      } else if (mode === 'EXCHANGE') {`;

const submitLogicReplace = `try {
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
      } else if (mode === 'EXCHANGE') {`;
content = content.replace(submitLogicMatch, submitLogicReplace);


// 4. Update validation in handleSubmit
const valMatch2 = `if (quantity <= 0 || quantity > maxQuantity) {
      alert("Quantidade inválida ou maior que o estoque.")
      setSubmitting(false)
      return
    }`;
const valReplace2 = `if (mode === 'EXCHANGE' && (quantity <= 0 || quantity > maxQuantity)) {
      alert("Quantidade inválida ou maior que o estoque.")
      setSubmitting(false)
      return
    }`;
content = content.replace(valMatch2, valReplace2);

// 5. Update reset in handleSubmit
const resetMatch = `// Reset
      setSelectedProductId("")
      setSelectedColor("")
      setSelectedSize("")
      setSelectedPeriod("")
      setReturnProductId("")
      setReturnColor("")
      setReturnSize("")
      setReturnPeriod("")
      setQuantity(1)
      setNotes("")`;
const resetReplace = `// Reset
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
      setCartItems([])`;
content = content.replace(resetMatch, resetReplace);


// 6. Handle mode change reset
const modeResetMatch = `setQuantity(1);
    setNotes("");`;
const modeResetReplace = `setQuantity(1);
    setNotes("");
    setCartItems([]);`;
content = content.replace(modeResetMatch, modeResetReplace);

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Applied backend changes");
