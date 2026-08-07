const fs = require('fs');
const path = require('path');

const files = [
  'src/components/BarcodeScannerModal.tsx',
  'src/components/ui/command.tsx',
  'src/pages/Brands.tsx',
  'src/pages/Categories.tsx',
  'src/pages/Clients.tsx',
  'src/pages/Kits.tsx',
  'src/pages/Orders.tsx',
  'src/pages/PaymentPlans.tsx',
  'src/pages/Prices.tsx',
  'src/pages/Products.tsx',
  'src/pages/Promotions.tsx',
  'src/pages/Purchases.tsx',
  'src/pages/StockAnalytics.tsx',
  'src/pages/StockEntry.tsx',
  'src/pages/StockExit.tsx',
  'src/pages/Suppliers.tsx'
];

for (const file of files) {
  const filePath = path.join('C:/Users/matheus.miguel/Documents/Node_projetos/Projeto_Perfume/perfume-store-dashboard', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add DialogTitle to import from "@/components/ui/dialog"
    if (content.includes('@/components/ui/dialog') && !content.includes('DialogTitle')) {
      content = content.replace(/(import\s*\{[^}]*)(\}\s*from\s*["']@\/components\/ui\/dialog["'])/g, '$1, DialogTitle $2');
    }
    
    // Replace <DialogContent ...> with <DialogContent ...>\n<DialogTitle className="sr-only">Dialog</DialogTitle>
    content = content.replace(/(<DialogContent[^>]*>)/g, '$1\n        <DialogTitle className="sr-only">Dialog</DialogTitle>');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
  }
}
