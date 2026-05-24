import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Shield } from "lucide-react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useIsPlatformAdmin } from "@/hooks/use-plataforma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  children: React.ReactNode;
};

export function PlatformAuthGate({ children }: Props) {
  const { loading, session } = useAuthSession();
  const { data: isAdmin, isLoading: adminLoading } = useIsPlatformAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || session) return;
    void navigate({
      to: "/plataforma/login",
      search: { redirect: "/plataforma/transportadoras" },
      replace: true,
    });
  }, [loading, session, navigate]);

  if (loading || adminLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Acesso restrito
            </CardTitle>
            <CardDescription>
              Esta área é exclusiva para super-administradores da plataforma. Contas de transportadora
              (proprietário ou operador) não têm acesso — use o login do ERP em /login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/login">Ir para login do ERP</Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/plataforma/login">Tentar outra conta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
