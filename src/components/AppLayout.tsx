import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBranch, branches } from "@/contexts/BranchContext";
import logo from "@/assets/logo.png";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const navSections = [
  {
    label: "Principal",
    items: [
      { label: "Dashboard", key: "/", icon: LayoutDashboard },
      { label: "Pedidos", key: "/pedidos", icon: ClipboardList, badge: 2 },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Produtos", key: "/produtos", icon: Package },
      { label: "Categorias", key: "/categorias", icon: FolderOpen },
    ],
  },
  {
    label: "Estoque",
    items: [
      { label: "Controle", key: "/estoque", icon: Warehouse },
      { label: "Entradas", key: "/estoque/entradas", icon: ArrowDownToLine },
      { label: "Saídas", key: "/estoque/saidas", icon: ArrowUpFromLine },
    ],
  },
  {
    label: "Análises",
    items: [
      { label: "Clientes", key: "/clientes", icon: Users },
      { label: "Relatórios", key: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Alertas", key: "/alertas", icon: Bell },
      { label: "Configurações", key: "/configuracoes", icon: Settings },
    ],
  },
];

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (key: string) => {
    if (key === "/") return location.pathname === "/";
    return location.pathname.startsWith(key);
  };

  const handleNav = (key: string) => {
    navigate(key);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-6 flex flex-col items-center border-b border-border">
        <img src={logo} alt="TassiAchando" className="w-14 h-14 rounded-full mb-2" />
        <h1 className="font-display text-base font-semibold text-primary">TassiAchando</h1>
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
          Perfumaria e Acessórios
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium px-3 mb-2">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 ${
                    isActive(item.key)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1.5">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {user?.name?.charAt(0) || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-card border-r border-border flex-col z-20">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:ml-56 flex-1 min-h-screen flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center gap-3 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <img src={logo} alt="TassiAchando" className="w-8 h-8 rounded-full" />
          <span className="font-display text-sm font-semibold text-primary">TassiAchando</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
