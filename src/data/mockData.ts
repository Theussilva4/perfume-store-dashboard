export interface BranchStock {
  matriz: number;
  filial1: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  brand: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  branchStock: BranchStock;
  minStock: number;
  image?: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  number: number;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: "pix" | "dinheiro" | "cartao" | "pendente";
  status: "aguardando" | "pago" | "separando" | "entregue" | "cancelado";
  date: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "entrada" | "saida";
  quantity: number;
  reason?: string;
  supplier?: string;
  cost?: number;
  date: string;
  notes?: string;
  branch: string;
}

export const categories: Category[] = [
  { id: "1", name: "Perfumes Importados", productCount: 12 },
  { id: "2", name: "Perfumes Nacionais", productCount: 8 },
  { id: "3", name: "Bolsas", productCount: 5 },
  { id: "4", name: "Relógios", productCount: 4 },
  { id: "5", name: "Óculos", productCount: 3 },
  { id: "6", name: "Acessórios", productCount: 7 },
];

export const products: Product[] = [
  { id: "1", name: "Baccarat Rouge 540", category: "Perfumes Importados", description: "Fragrância oriental floral", brand: "Maison Francis Kurkdjian", costPrice: 280, salePrice: 500, stock: 12, minStock: 5, active: true },
  { id: "2", name: "Bleu de Chanel", category: "Perfumes Importados", description: "Fragrância amadeirada aromática", brand: "Chanel", costPrice: 220, salePrice: 400, stock: 8, minStock: 5, active: true },
  { id: "3", name: "Santal 33", category: "Perfumes Importados", description: "Fragrância amadeirada", brand: "Le Labo", costPrice: 350, salePrice: 600, stock: 3, minStock: 5, active: true },
  { id: "4", name: "Aventus Creed", category: "Perfumes Importados", description: "Fragrância frutada", brand: "Creed", costPrice: 400, salePrice: 800, stock: 5, minStock: 3, active: true },
  { id: "5", name: "Light Blue D&G", category: "Perfumes Importados", description: "Fragrância cítrica", brand: "Dolce & Gabbana", costPrice: 150, salePrice: 300, stock: 15, minStock: 5, active: true },
  { id: "6", name: "Oud Wood", category: "Perfumes Importados", description: "Fragrância oud", brand: "Tom Ford", costPrice: 380, salePrice: 700, stock: 2, minStock: 3, active: true },
  { id: "7", name: "Flowerbomb", category: "Perfumes Importados", description: "Fragrância floral oriental", brand: "Viktor & Rolf", costPrice: 200, salePrice: 380, stock: 5, minStock: 5, active: true },
  { id: "8", name: "Noir de Noir", category: "Perfumes Importados", description: "Fragrância oriental", brand: "Tom Ford", costPrice: 420, salePrice: 850, stock: 1, minStock: 3, active: true },
  { id: "9", name: "Malbec", category: "Perfumes Nacionais", description: "Fragrância amadeirada", brand: "O Boticário", costPrice: 60, salePrice: 130, stock: 20, minStock: 10, active: true },
  { id: "10", name: "Egeo", category: "Perfumes Nacionais", description: "Fragrância fresca", brand: "O Boticário", costPrice: 50, salePrice: 110, stock: 18, minStock: 10, active: true },
  { id: "11", name: "Bolsa Elegance Preta", category: "Bolsas", description: "Bolsa de couro sintético", brand: "TassiAchando", costPrice: 45, salePrice: 120, stock: 7, minStock: 3, active: true },
  { id: "12", name: "Relógio Classic Gold", category: "Relógios", description: "Relógio analógico dourado", brand: "TassiAchando", costPrice: 80, salePrice: 200, stock: 4, minStock: 2, active: true },
];

export const orders: Order[] = [
  { id: "1", number: 1001, clientName: "Maria Silva", clientPhone: "(11) 99999-1111", items: [{ productId: "1", productName: "Baccarat Rouge 540", quantity: 1, price: 500 }], total: 500, paymentMethod: "pix", status: "entregue", date: "2026-03-11" },
  { id: "2", number: 1002, clientName: "João Santos", clientPhone: "(11) 99999-2222", items: [{ productId: "2", productName: "Bleu de Chanel", quantity: 1, price: 400 }, { productId: "5", productName: "Light Blue D&G", quantity: 1, price: 300 }], total: 700, paymentMethod: "cartao", status: "pago", date: "2026-03-11" },
  { id: "3", number: 1003, clientName: "Ana Oliveira", clientPhone: "(11) 99999-3333", items: [{ productId: "4", productName: "Aventus Creed", quantity: 1, price: 800 }], total: 800, paymentMethod: "pendente", status: "aguardando", date: "2026-03-10" },
  { id: "4", number: 1004, clientName: "Carlos Pereira", clientPhone: "(11) 99999-4444", clientAddress: "Rua das Flores, 123", items: [{ productId: "9", productName: "Malbec", quantity: 2, price: 130 }], total: 260, paymentMethod: "dinheiro", status: "separando", date: "2026-03-10" },
  { id: "5", number: 1005, clientName: "Lucia Ferreira", clientPhone: "(11) 99999-5555", items: [{ productId: "11", productName: "Bolsa Elegance Preta", quantity: 1, price: 120 }, { productId: "7", productName: "Flowerbomb", quantity: 1, price: 380 }], total: 500, paymentMethod: "pix", status: "entregue", date: "2026-03-09" },
  { id: "6", number: 1006, clientName: "Pedro Lima", clientPhone: "(11) 99999-6666", items: [{ productId: "3", productName: "Santal 33", quantity: 1, price: 600 }], total: 600, paymentMethod: "pix", status: "pago", date: "2026-03-09" },
  { id: "7", number: 1007, clientName: "Fernanda Costa", clientPhone: "(11) 99999-7777", items: [{ productId: "12", productName: "Relógio Classic Gold", quantity: 1, price: 200 }], total: 200, paymentMethod: "cartao", status: "cancelado", date: "2026-03-08" },
];

export const clients: Client[] = [
  { id: "1", name: "Maria Silva", phone: "(11) 99999-1111", orderCount: 5, totalSpent: 2800 },
  { id: "2", name: "João Santos", phone: "(11) 99999-2222", orderCount: 3, totalSpent: 1900 },
  { id: "3", name: "Ana Oliveira", phone: "(11) 99999-3333", orderCount: 2, totalSpent: 1600 },
  { id: "4", name: "Carlos Pereira", phone: "(11) 99999-4444", orderCount: 4, totalSpent: 1040 },
  { id: "5", name: "Lucia Ferreira", phone: "(11) 99999-5555", orderCount: 6, totalSpent: 3200 },
  { id: "6", name: "Pedro Lima", phone: "(11) 99999-6666", orderCount: 1, totalSpent: 600 },
  { id: "7", name: "Fernanda Costa", phone: "(11) 99999-7777", orderCount: 2, totalSpent: 400 },
];

export const stockMovements: StockMovement[] = [
  { id: "1", productId: "1", productName: "Baccarat Rouge 540", type: "entrada", quantity: 10, supplier: "Importadora Luxe", cost: 2800, date: "2026-03-01", notes: "Reposição mensal" },
  { id: "2", productId: "2", productName: "Bleu de Chanel", type: "entrada", quantity: 5, supplier: "Importadora Luxe", cost: 1100, date: "2026-03-01" },
  { id: "3", productId: "1", productName: "Baccarat Rouge 540", type: "saida", quantity: 1, reason: "venda", date: "2026-03-11" },
  { id: "4", productId: "6", productName: "Oud Wood", type: "saida", quantity: 1, reason: "perda", date: "2026-03-08", notes: "Frasco quebrado" },
  { id: "5", productId: "9", productName: "Malbec", type: "entrada", quantity: 20, supplier: "O Boticário Distribuidor", cost: 1200, date: "2026-03-05" },
];

export const paymentMethodLabels: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pendente: "Pendente",
};

export const statusLabels: Record<string, string> = {
  aguardando: "Aguardando Pagamento",
  pago: "Pago",
  separando: "Separando",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const statusColors: Record<string, string> = {
  aguardando: "text-amber-600 bg-amber-50",
  pago: "text-primary bg-primary/10",
  separando: "text-blue-600 bg-blue-50",
  entregue: "text-success bg-success/10",
  cancelado: "text-destructive bg-destructive/10",
};
