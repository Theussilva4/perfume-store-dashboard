import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BranchProvider } from "@/contexts/BranchContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Users from "@/pages/Users";
import SetupPassword from "@/pages/SetupPassword";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Brands from "@/pages/Brands";
import Stock from "@/pages/Stock";
import StockEntry from "@/pages/StockEntry";
import StockExit from "@/pages/StockExit";
import StockTransfers from "@/pages/StockTransfers";
import Orders from "./pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Sellers from "./pages/Sellers";
import Clients from "@/pages/Clients";
import Suppliers from "@/pages/Suppliers";
import Reports from "@/pages/Reports";
import Alerts from "@/pages/Alerts";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import Purchases from "@/pages/Purchases";
import Prices from "@/pages/Prices";
import Promotions from "@/pages/Promotions";
import Kits from "@/pages/Kits";
import PaymentPlans from "./pages/PaymentPlans";
import PriceCheck from "@/pages/PriceCheck";
import StockAnalytics from "@/pages/StockAnalytics";
import SalesReport from "@/pages/SalesReport";
import MeuCaixa from "@/pages/MeuCaixa";
import Conference from "@/pages/Conference";
import Expirations from "./pages/Expirations";
import AccountsReceivable from "@/pages/AccountsReceivable";
const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { estaAutenticado } = useAuth();
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { estaAutenticado } = useAuth();
  if (estaAutenticado) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BranchProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/configurar-senha" element={<PublicRoute><SetupPassword /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="produtos" element={<Products />} />
              <Route path="/categorias" element={<Categories />} />
              <Route path="/marcas" element={<Brands />} />
              <Route path="/planos-pagamento" element={<PaymentPlans />} />
              <Route path="estoque" element={<Stock />} />
              <Route path="estoque/entradas" element={<StockEntry />} />
              <Route path="estoque/saidas" element={<StockExit />} />
              <Route path="estoque/transferencias" element={<StockTransfers />} />
              <Route path="pedidos" element={<Orders />} />
              <Route path="pedidos/:id" element={<OrderDetail />} />
              <Route path="consulta-preco" element={<PriceCheck />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="vendedores" element={<Sellers />} />
              <Route path="fornecedores" element={<Suppliers />} />
              <Route path="compras" element={<Purchases />} />
              <Route path="conferencia" element={<Conference />} />
              <Route path="precos" element={<Prices />} />
              <Route path="promocoes" element={<Promotions />} />
              <Route path="kits" element={<Kits />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="analises/estoque" element={<StockAnalytics />} />
              <Route path="analises/vendas" element={<SalesReport />} />
              <Route path="contas-receber" element={<AccountsReceivable />} />
              <Route path="meu-caixa" element={<MeuCaixa />} />
              <Route path="usuarios" element={<Users />} />
              <Route path="alertas" element={<Alerts />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/validades" element={<Expirations />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </BranchProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
