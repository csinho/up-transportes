import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { getMotoristaSession } from "@/lib/motorista-session";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";
import { MotoristaShell } from "@/components/motorista/MotoristaShell";
import { MotoristaInstalarPwa } from "@/components/motorista/MotoristaInstalarPwa";
import { MotoristaLoginForm } from "@/components/motorista/MotoristaLoginForm";
import { TransportadoraLogo } from "@/components/transportadora/TransportadoraLogo";
import { redirectMotoristaSeAutenticado } from "@/lib/motorista-auth-route";
import {
  isValidTransportadoraId,
  persistMotoristaBrandingTenant,
  resolveMotoristaBrandingTenantId,
} from "@/lib/motorista-tenant";

const searchSchema = z.object({
  t: z.string().optional(),
});

export const Route = createFileRoute("/motorista/")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: redirectMotoristaSeAutenticado,
  component: Page,
});

function Page() {
  const { t } = Route.useSearch();
  const transportadoraId = resolveMotoristaBrandingTenantId(t);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (isValidTransportadoraId(t)) persistMotoristaBrandingTenant(t);
  }, [t]);

  /** Sessão local: pula login ao reabrir o PWA offline (beforeLoad pode não ver storage no SSR). */
  useEffect(() => {
    const session = getMotoristaSession();
    if (!session) return;
    void loadMotoristaCacheIntoQueries(qc, session.transportadoraId);
    void navigate({ to: "/motorista/dashboard", replace: true });
  }, [navigate, qc]);

  return (
    <MotoristaShell titulo="Entrar" auth transportadoraId={transportadoraId}>
      <div className="space-y-6 pt-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <TransportadoraLogo transportadoraId={transportadoraId} size="lg" showName />
          <div className="space-y-2 max-w-xs">
            <h1 className="text-2xl font-bold tracking-tight">App do motorista</h1>
            <p className="text-sm text-muted-foreground">
              Área exclusiva para motoristas. Faça login para ver viagens, fretes e atualizar o
              status das entregas.
            </p>
          </div>
        </div>
        <MotoristaInstalarPwa variant="card" />
        <MotoristaLoginForm />
      </div>
    </MotoristaShell>
  );
}
