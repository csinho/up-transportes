import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2, ExternalLink, Shield } from "lucide-react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useErpPermissions } from "@/hooks/use-erp-permissions";
import { useIsPlatformAdmin } from "@/hooks/use-plataforma";
import { useTransportadoras } from "@/data/store";
import { ensureDemoTenantLink } from "@/lib/supabase/link-transportadora";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  children: React.ReactNode;
};

/** Redireciona para /login quando não há sessão Supabase. Bloqueia perfis sem acesso ao ERP. */
export function ErpAuthGate({ children }: Props) {
  const { loading, session } = useAuthSession();
  const { canAccessErp, loading: roleLoading } = useErpPermissions();
  const { data: isPlatformAdmin } = useIsPlatformAdmin();
  const { data: transportadoras = [], isLoading: tenantsLoading } = useTransportadoras();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!session) {
      setBootstrapping(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setBootstrapping(true);
      await ensureDemoTenantLink();
      await queryClient.invalidateQueries({ queryKey: ["transportadoras"] });
      await queryClient.invalidateQueries({ queryKey: ["user-tenant-role"] });
      if (!cancelled) setBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, session, queryClient]);

  useEffect(() => {
    if (loading || !session || bootstrapping) return;
    if (!roleLoading && !tenantsLoading && isPlatformAdmin && transportadoras.length === 0 && !canAccessErp) {
      void navigate({ to: "/plataforma/transportadoras", replace: true });
    }
  }, [
    loading,
    session,
    bootstrapping,
    roleLoading,
    tenantsLoading,
    isPlatformAdmin,
    transportadoras.length,
    canAccessErp,
    navigate,
  ]);

  useEffect(() => {
    if (loading || session) return;
    void navigate({
      to: "/login",
      search: { redirect: pathname || "/" },
      replace: true,
    });
  }, [loading, session, pathname, navigate]);

  if (loading || bootstrapping || roleLoading || tenantsLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return null;

  if (!canAccessErp) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sem acesso ao ERP
            </CardTitle>
            <CardDescription>
              {transportadoras.length === 0
                ? "Sua transportadora pode estar suspensa ou você ainda não foi vinculado. Use o e-mail do convite em /login → Primeiro acesso para criar sua senha."
                : "Este perfil não utiliza o painel ERP. Para acompanhar uma viagem, use o link enviado pela transportadora."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => void navigate({ to: "/login", search: { redirect: "/" } })}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
