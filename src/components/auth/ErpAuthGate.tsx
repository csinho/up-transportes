import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { ensureDemoTenantLink } from "@/lib/supabase/link-transportadora";

type Props = {
  children: React.ReactNode;
};

/** Redireciona para /login quando não há sessão Supabase. */
export function ErpAuthGate({ children }: Props) {
  const { loading, session } = useAuthSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || !session) return;
    void ensureDemoTenantLink();
  }, [loading, session]);

  useEffect(() => {
    if (loading || session) return;
    void navigate({
      to: "/login",
      search: { redirect: pathname || "/" },
      replace: true,
    });
  }, [loading, session, pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!session) return null;

  return children;
}
