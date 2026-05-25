import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMotoristaViagens } from "@/hooks/use-motorista-data";
import { useMotoristaDashboardSync } from "@/hooks/use-motorista-dashboard-sync";
import { MotoristaShell } from "@/components/motorista/MotoristaShell";
import { MotoristaDashboardResumo } from "@/components/motorista/MotoristaDashboardResumo";
import { MotoristaViagemDestaque } from "@/components/motorista/MotoristaViagemDestaque";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { calcularResumoMotorista } from "@/lib/motorista-stats";
import { hydrateMotoristaCacheBeforeLoad } from "@/lib/motorista-route-cache";
import { Button } from "@/components/ui/button";
import { PackageOpen, List } from "lucide-react";

export const Route = createFileRoute("/motorista/dashboard")({
  beforeLoad: ({ context }) => hydrateMotoristaCacheBeforeLoad(context),
  head: () => ({ meta: [{ title: "Início — App Motorista" }] }),
  component: Page,
});

function Page() {
  const { session } = useMotoristaSession();
  useMotoristaDashboardSync();
  const { data: viagens = [] } = useMotoristaViagens();

  const resumo = useMemo(() => {
    if (!session) return null;
    return calcularResumoMotorista(viagens, session.motoristaId);
  }, [viagens, session]);

  if (!session || !resumo) {
    return (
      <MotoristaShell titulo="Início" auth>
        <p className="text-sm text-muted-foreground text-center pt-8">Carregando…</p>
      </MotoristaShell>
    );
  }

  return (
    <MotoristaShell titulo="Início" transportadoraId={session.transportadoraId}>
      <div className="space-y-6">
        <MotoristaDashboardResumo resumo={resumo} motoristaNome={session.nome} />

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Viagem liberada</h2>
          {resumo.viagemAtual ? (
            <MotoristaViagemDestaque viagem={resumo.viagemAtual} />
          ) : (
            <div className="rounded-xl border border-dashed p-6 text-center space-y-2">
              <PackageOpen className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Nenhuma viagem ativa no momento</p>
              <p className="text-xs text-muted-foreground">
                Quando a transportadora liberar uma viagem, ela aparecerá aqui com tempo e status.
              </p>
            </div>
          )}
        </section>

        <Button variant="outline" className="w-full" asChild>
          <Link to="/motorista/viagens" preload={false}>
            <List className="h-4 w-4 mr-2" />
            Ver todas as minhas viagens
          </Link>
        </Button>
      </div>
    </MotoristaShell>
  );
}
