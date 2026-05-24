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
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
            P
          </div>
          <div className="text-sm">
            <p className="font-semibold leading-none">Plataforma</p>
            <p className="text-xs text-muted-foreground">Gestão SaaS</p>
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
