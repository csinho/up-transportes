import { createFileRoute } from "@tanstack/react-router";
import { requireErpRoles } from "@/lib/erp-auth-route";
import {
  useAllViagemEventos,
  useAllViagemOcorrencias,
  useViagens,
  useActiveTenantId,
  useTransportadora,
} from "@/data/store";
import { AuditoriaEventosList } from "@/components/auditoria/AuditoriaEventosList";
import { AuditoriaOcorrenciasList } from "@/components/auditoria/AuditoriaOcorrenciasList";
import { PageHeader } from "@/components/operacional/PageHeader";
import { KpiCard } from "@/components/operacional/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, AlertTriangle, Users, UserCog, FileWarning } from "lucide-react";

export const Route = createFileRoute("/auditoria")({
  beforeLoad: () => requireErpRoles("owner"),
  head: () => ({
    meta: [
      { title: "Auditoria — ERP Transportadora" },
      { name: "description", content: "Histórico e auditoria de eventos e ocorrências." },
    ],
  }),
  component: Page,
});

function Page() {
  const tenantId = useActiveTenantId();
  const { data: transportadora } = useTransportadora(tenantId);
  const { data: viagens = [] } = useViagens();
  const { data: eventos = [] } = useAllViagemEventos();
  const { data: ocorrencias = [] } = useAllViagemOcorrencias();

  const eventosMotorista = eventos.filter((e) => e.origem === "motorista").length;
  const eventosOperador = eventos.filter((e) => e.origem === "operador").length;
  const ocorrenciasAbertas = ocorrencias.filter((o) => o.status === "aberta").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico e auditoria"
        description="Linha do tempo de eventos e ocorrências de todas as viagens da transportadora."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={History} label="Total de eventos" value={eventos.length} accent="blue" />
        <KpiCard icon={Users} label="Via motorista (app)" value={eventosMotorista} accent="green" />
        <KpiCard icon={UserCog} label="Via operador (ERP)" value={eventosOperador} accent="navy" />
        <KpiCard
          icon={FileWarning}
          label="Ocorrências abertas"
          value={ocorrenciasAbertas}
          accent="amber"
          alert={ocorrenciasAbertas > 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos da operação</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditoriaEventosList
            eventos={eventos}
            viagens={viagens}
            transportadora={transportadora}
            variant="timeline"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Ocorrências registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuditoriaOcorrenciasList
            ocorrencias={ocorrencias}
            viagens={viagens}
            transportadora={transportadora}
          />
        </CardContent>
      </Card>
    </div>
  );
}
