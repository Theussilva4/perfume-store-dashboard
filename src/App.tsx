import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BranchProvider } from "@/contexts/BranchContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import SetupPassword from "@/pages/SetupPassword";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Brands from "@/pages/Brands";
import Stock from "@/pages/Stock";
import StockEntry from "@/pages/StockEntry";
import StockExit from "@/pages/StockExit";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Clients from "@/pages/Clients";
import Suppliers from "@/pages/Suppliers";
import Reports from "@/pages/Reports";
import Alerts from "@/pages/Alerts";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import Purchases from "@/pages/Purchases";
import Prices from "@/pages/Prices";
import Promotions from "@/pages/Promotions";
import PaymentPlans from "./pages/PaymentPlans";

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
              <Route path="pedidos" element={<Orders />} />
              <Route path="pedidos/:id" element={<OrderDetail />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="fornecedores" element={<Suppliers />} />
              <Route path="compras" element={<Purchases />} />
              <Route path="precos" element={<Prices />} />
              <Route path="promocoes" element={<Promotions />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="usuarios/novo" element={<Register />} />
              <Route path="alertas" element={<Alerts />} />
              <Route path="configuracoes" element={<SettingsPage />} />
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
