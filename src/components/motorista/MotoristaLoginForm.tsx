import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { maskCPF } from "@/lib/masks";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { loginMotoristaPorCpf } from "@/lib/supabase/motorista-auth";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { persistMotoristaBrandingTenant } from "@/lib/motorista-tenant";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { tryMotoristaOfflineLogin } from "@/lib/motorista-offline-login";
import { getMotoristaSession } from "@/lib/motorista-session";
import { toast } from "sonner";
import { LogIn, WifiOff } from "lucide-react";

type Props = {
  onSuccess?: () => void;
};

export function MotoristaLoginForm({ onSuccess }: Props) {
  const { loginWithAuth } = useMotoristaSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cpf, setCpf] = useState("");
  const [entrando, setEntrando] = useState(false);
  const offline = typeof navigator !== "undefined" && !isMotoristaOnline();
  const sessaoSalva = getMotoristaSession();

  const entrar = () => {
    if (entrando) return;
    setEntrando(true);

    void (async () => {
      try {
        if (!isMotoristaOnline()) {
          const offlineResult = await tryMotoristaOfflineLogin(cpf, qc);
          if (offlineResult.ok === false) {
            if (offlineResult.message !== "use_online") {
              toast.error(offlineResult.message);
            }
          } else {
            toast.success(`Bem-vindo de volta, ${offlineResult.session.nome.split(" ")[0]}!`);
            onSuccess?.();
            void navigate({ to: "/motorista/dashboard", replace: true });
          }
          return;
        }

        const auth = await loginMotoristaPorCpf(cpf);
        loginWithAuth({
          motoristaId: auth.motoristaId,
          transportadoraId: auth.transportadoraId,
          nome: auth.nome,
          cpf,
        });
        persistMotoristaBrandingTenant(auth.transportadoraId);
        await qc.invalidateQueries();
        toast.success(`Bem-vindo, ${auth.nome.split(" ")[0]}!`);
        onSuccess?.();
        void navigate({ to: "/motorista/dashboard", replace: true });
      } catch (err) {
        toast.error(traduzirErroSupabase(err));
      } finally {
        setEntrando(false);
      }
    })();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <LogIn className="h-5 w-5" />
          Entrar
        </CardTitle>
        <CardDescription>Informe seu CPF para acessar suas viagens.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {offline && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100 flex gap-2">
            <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {sessaoSalva
                ? "Sem internet. Informe o mesmo CPF do último login neste aparelho para abrir suas viagens salvas."
                : "Sem internet. O primeiro acesso precisa ser feito com conexão; depois você poderá usar offline."}
            </span>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="cpf-motorista">CPF</Label>
          <Input
            id="cpf-motorista"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
          />
        </div>
        <Button className="w-full" size="lg" onClick={entrar} disabled={entrando}>
          {entrando ? "Entrando…" : "Acessar app"}
        </Button>
      </CardContent>
    </Card>
  );
}
