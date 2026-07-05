const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// replace required for selectedProductId
content = content.replace(
  `                  <select
                    required
                    value={selectedProductId}`,
  `                  <select
                    required={mode === 'EXCHANGE' || cartItems.length === 0}
                    value={selectedProductId}`
);

// replace required for selectedColor
content = content.replace(
  `                    <select
                      required
                      value={selectedColor}`,
  `                    <select
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      value={selectedColor}`
);

// replace required for selectedSize
content = content.replace(
  `                    <select
                      required
                      value={selectedSize}`,
  `                    <select
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      value={selectedSize}`
);

// replace required for selectedPeriod
content = content.replace(
  `                    <select
                      required
                      value={selectedPeriod}`,
  `                    <select
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      value={selectedPeriod}`
);

// replace required for quantity
content = content.replace(
  `                    <input
                      type="number"
                      required
                      min="1"
                      max={maxQuantity}`,
  `                    <input
                      type="number"
                      required={mode === 'EXCHANGE' || cartItems.length === 0}
                      min="1"
                      max={maxQuantity}`
);

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Updated required fields");
