import logo from "@/assets/logo.png";

const navItems = [
  { label: "Visão Geral", key: "overview" },
  { label: "Pedidos", key: "orders" },
  { label: "Estoque", key: "inventory" },
  { label: "Relatórios", key: "reports" },
  { label: "Clientes", key: "customers" },
  { label: "Configurações", key: "settings" },
];

interface SidebarNavProps {
  active: string;
  onNavigate: (key: string) => void;
}

const SidebarNav = ({ active, onNavigate }: SidebarNavProps) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-background flex flex-col py-10 px-6 animate-fade-in-up z-10">
      <div className="mb-12 flex flex-col items-center">
        <img src={logo} alt="TassiAchando" className="w-20 h-20 rounded-full mb-3" />
        <h1 className="font-display text-lg font-semibold text-primary tracking-wide">
          TassiAchando
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-body tracking-widest uppercase">
          Perfumaria e Acessórios
        </p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`text-left py-2.5 px-3 rounded-sm text-sm font-body transition-colors duration-300 ${
              active === item.key
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <p className="text-xs text-muted-foreground/50 font-body">
          Atelier Sillage © 2026
        </p>
      </div>
    </aside>
  );
};

export default SidebarNav;
