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
  Map,
} from "lucide-react";
import { FeedbackSidebarButton } from "@/components/feedback/FeedbackSidebarButton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
      <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-wider font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              path === item.url || (item.url !== "/" && path.startsWith(item.url));
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    isActive &&
                      "!bg-white/10 !text-white border-l-4 border-brand-orange rounded-l-none font-medium",
                  )}
                >
                  <Link to={item.url}>
                    <item.icon className={cn("h-4 w-4", isActive && "text-brand-orange")} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader
        className={cn(
          "px-4 py-4 border-b border-sidebar-border",
          "group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-3 group-data-[collapsible=icon]:overflow-hidden",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 min-w-0",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0",
          )}
        >
          <div
            className={cn(
              "h-10 w-10 shrink-0 rounded-xl bg-brand-blue text-white flex items-center justify-center shadow-md",
              "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
            )}
          >
            <Map className="h-5 w-5 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="font-display font-bold leading-tight text-white text-sm">Mapa da Carga</p>
            <p className="text-[11px] text-sidebar-foreground/70 truncate">Gestão de viagens</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <NavGroup label="Operação" items={operacaoFiltrada} path={path} />
        <NavGroup label="Cadastros" items={cadastros} path={path} />
        <NavGroup label="Configurações" items={configFiltrada} path={path} />
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border">
        <FeedbackSidebarButton />
      </SidebarFooter>
    </Sidebar>
  );
}
