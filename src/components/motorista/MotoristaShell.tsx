import { useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { bootstrapMotoristaPwaOffline } from "@/lib/motorista-pwa-bootstrap";
import { Home, List, LogOut, Wifi, WifiOff, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MotoristaInstalarPwa } from "@/components/motorista/MotoristaInstalarPwa";
import { TransportadoraLogo } from "@/components/transportadora/TransportadoraLogo";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { useMotoristaOfflineSync } from "@/hooks/use-motorista-offline-sync";
import { useMotoristaQueueBootstrap } from "@/hooks/use-motorista-cache-bootstrap";
import { registerMotoristaServiceWorker } from "@/lib/register-motorista-sw";
import type { UUID } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  titulo?: string;
  voltarPara?: string;
  /** Tela de login — sem menu inferior */
  auth?: boolean;
  transportadoraId?: UUID;
  children: React.ReactNode;
};

export function MotoristaShell({
  titulo = "Motorista",
  voltarPara,
  auth,
  transportadoraId: transportadoraIdProp,
  children,
}: Props) {
  const { session, logout } = useMotoristaSession();
  const { online, pending } = useMotoristaOfflineSync();
  useMotoristaQueueBootstrap();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const transportadoraId = session?.transportadoraId ?? transportadoraIdProp;

  useEffect(() => {
    registerMotoristaServiceWorker();
  }, []);

  useEffect(() => {
    if (!session) return;
    void bootstrapMotoristaPwaOffline(qc);
  }, [session?.motoristaId, session?.transportadoraId, qc]);

  const sair = () => {
    const tenantId = session?.transportadoraId;
    logout();
    void navigate({
      to: "/motorista",
      search: tenantId ? { t: tenantId } : {},
    });
  };

  const navItems = [
    {
      to: "/motorista/dashboard",
      label: "Início",
      icon: Home,
      match: (p: string) => p.startsWith("/motorista/dashboard"),
    },
    {
      to: "/motorista/viagens",
      label: "Viagens",
      icon: List,
      match: (p: string) => p.startsWith("/motorista/viagens"),
    },
  ] as const;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center justify-between gap-3 px-4 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0">
            <TransportadoraLogo transportadoraId={transportadoraId} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{titulo}</p>
              {session && !auth && (
                <p className="text-xs text-muted-foreground truncate">{session.nome}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <MotoristaInstalarPwa />
            {!online && pending > 0 && (
              <Badge variant="secondary" className="text-xs gap-1 px-2">
                <CloudOff className="h-3 w-3" />
                {pending}
              </Badge>
            )}
            {online ? (
              <Wifi className="h-4 w-4 text-emerald-600" aria-label="Online" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-600" aria-label="Offline" />
            )}
            {session && !auth && (
              <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {!online && !auth && (
          <div className="bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-800 dark:text-amber-200">
            {pending > 0
              ? `${pending} alteração(ões) no aparelho — serão enviadas ao reconectar`
              : "Sem internet — dados salvos no aparelho (IndexedDB)"}
          </div>
        )}
      </header>

      {voltarPara && (
        <div className="px-4 pt-3 max-w-lg mx-auto w-full">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to={voltarPara} preload={false}>← Voltar</Link>
          </Button>
        </div>
      )}

      <main className={cn("flex-1 px-4 py-4 max-w-lg mx-auto w-full", auth ? "pb-8" : "pb-24")}>
        {children}
      </main>

      {session && !auth && (
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
          <div className="flex max-w-lg mx-auto">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload={false}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                    active ? "text-primary font-medium" : "text-muted-foreground",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
