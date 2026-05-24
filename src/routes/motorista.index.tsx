import { createFileRoute } from "@tanstack/react-router";
import { MotoristaShell } from "@/components/motorista/MotoristaShell";
import { MotoristaInstalarPwa } from "@/components/motorista/MotoristaInstalarPwa";
import { MotoristaLoginForm } from "@/components/motorista/MotoristaLoginForm";
import { redirectMotoristaSeAutenticado } from "@/lib/motorista-auth-route";

export const Route = createFileRoute("/motorista/")({
  beforeLoad: redirectMotoristaSeAutenticado,
  component: Page,
});

function Page() {
  return (
    <MotoristaShell titulo="Entrar" auth>
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">App do motorista</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Área exclusiva para motoristas. Faça login para ver viagens, fretes e atualizar o status
            das entregas.
          </p>
        </div>
        <MotoristaInstalarPwa variant="card" />
        <MotoristaLoginForm />
      </div>
    </MotoristaShell>
  );
}
