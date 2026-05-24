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
import { toast } from "sonner";
import { LogIn } from "lucide-react";

type Props = {
  onSuccess?: () => void;
};

export function MotoristaLoginForm({ onSuccess }: Props) {
  const { loginWithAuth } = useMotoristaSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cpf, setCpf] = useState("");
  const [entrando, setEntrando] = useState(false);

  const entrar = () => {
    if (entrando) return;
    setEntrando(true);

    void (async () => {
      try {
        const auth = await loginMotoristaPorCpf(cpf);
        loginWithAuth({
          motoristaId: auth.motoristaId,
          transportadoraId: auth.transportadoraId,
          nome: auth.nome,
          cpf,
        });
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
