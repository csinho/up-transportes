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
  History,
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
import { useErpPermissions } from "@/hooks/use-erp-permissions";
import { cn } from "@/lib/utils";

const operacao = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Viagens", url: "/viagens", icon: RouteIcon },
  { title: "Rastreamento", url: "/rastreamento", icon: MapPin },
  { title: "Auditoria", url: "/auditoria", icon: History, ownerOnly: true },
];

const cadastros = [
  { title: "Cadastro motoristas", url: "/motoristas", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: Truck },
  { title: "Clientes", url: "/clientes", icon: Briefcase },
  { title: "Produtos / Cargas", url: "/produtos", icon: Package },
];

const config = [{ title: "Transportadora", url: "/transportadora", icon: Building2, ownerOnly: true }];

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
};

function NavGroup({ label, items, path }: { label: string; items: NavItem[]; path: string }) {
  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={path === item.url || (item.url !== "/" && path.startsWith(item.url))}
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
  const { canAccessAuditoria, canAccessTransportadoraConfig } = useErpPermissions();

  const operacaoFiltrada = operacao.filter((i) => !i.ownerOnly || canAccessAuditoria);
  const configFiltrada = config.filter((i) => !i.ownerOnly || canAccessTransportadoraConfig);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader
        className={cn(
          "px-4 py-3",
          "group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:overflow-hidden",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 min-w-0",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0",
          )}
        >
          <div
            className={cn(
              "h-8 w-8 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm",
              "group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:text-xs",
            )}
          >
            T
          </div>
          <div className="min-w-0 text-sm group-data-[collapsible=icon]:hidden">
            <p className="font-semibold leading-none truncate">ERP Transp.</p>
            <p className="text-xs text-muted-foreground truncate">Operação de viagens</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Operação" items={operacaoFiltrada} path={path} />
        <NavGroup label="Cadastros de apoio" items={cadastros} path={path} />
        <NavGroup label="Configurações" items={configFiltrada} path={path} />
      </SidebarContent>
    </Sidebar>
  );
}
