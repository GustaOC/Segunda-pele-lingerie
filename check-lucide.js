const lucide = require('lucide-react');
const icons = ['ShoppingCart', 'Search', 'Heart', 'User', 'ArrowRight', 'Menu', 'Star', 'StarHalf', 'Truck', 'ShieldCheck', 'CreditCard', 'Plus', 'Trash2', 'ChevronLeft', 'ChevronRight', 'Facebook', 'Instagram', 'ArrowUp', 'ArrowDown'];
let missing = [];
for (let icon of icons) {
  if (!lucide[icon]) {
    missing.push(icon);
  }
}
console.log('Missing icons:', missing);
