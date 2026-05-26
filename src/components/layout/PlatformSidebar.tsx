import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Building2, LogOut } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { signOut, useAuthSession } from "@/hooks/use-auth-session";
import { toast } from "sonner";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { cn } from "@/lib/utils";

const items = [
  { title: "Transportadoras", url: "/plataforma/transportadoras", icon: Building2 },
];

export function PlatformSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuthSession();
  const navigate = useNavigate();

  const sair = async () => {
    try {
      await signOut();
      void navigate({ to: "/plataforma/login", replace: true });
    } catch (err) {
      toast.error(traduzirErroSupabase(err, "Não foi possível sair"));
    }
  };

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
              "h-8 w-8 shrink-0 rounded-md bg-brand-navy text-white flex items-center justify-center font-bold text-sm",
              "group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:text-xs",
            )}
          >
            P
          </div>
          <div className="min-w-0 text-sm group-data-[collapsible=icon]:hidden">
            <p className="font-semibold leading-none truncate">Plataforma</p>
            <p className="text-xs text-muted-foreground truncate">Gestão SaaS</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={path === item.url || path.startsWith(`${item.url}/`)}
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
      </SidebarContent>
      <div className="p-3 border-t mt-auto space-y-2">
        <p className="text-xs text-muted-foreground truncate px-2">{user?.email}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => void sair()}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </Sidebar>
  );
}
