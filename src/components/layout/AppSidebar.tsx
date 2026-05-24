import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  Truck,
  Briefcase,
  Package,
  Route as RouteIcon,
  MapPin,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const operacao = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Viagens", url: "/viagens", icon: RouteIcon },
  { title: "Rastreamento", url: "/rastreamento", icon: MapPin },
];

const cadastros = [
  { title: "Cadastro motoristas", url: "/motoristas", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: Truck },
  { title: "Clientes", url: "/clientes", icon: Briefcase },
  { title: "Produtos / Cargas", url: "/produtos", icon: Package },
];

const config = [
  { title: "Transportadora", url: "/transportadora", icon: Building2 },
];

function NavGroup({
  label,
  items,
  path,
}: {
  label: string;
  items: typeof operacao;
  path: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={
                  path === item.url ||
                  (item.url !== "/" && path.startsWith(item.url))
                }
              >
                <Link to={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
            T
          </div>
          <div className="text-sm">
            <p className="font-semibold leading-none">ERP Transp.</p>
            <p className="text-xs text-muted-foreground">Operação de viagens</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Operação" items={operacao} path={path} />
        <NavGroup label="Cadastros de apoio" items={cadastros} path={path} />
        <NavGroup label="Configurações" items={config} path={path} />
      </SidebarContent>
    </Sidebar>
  );
}
