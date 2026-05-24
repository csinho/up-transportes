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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, AlertTriangle } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-7 w-7" />
          Histórico e auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Linha do tempo de eventos e ocorrências de todas as viagens da transportadora.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de eventos</p>
            <p className="text-2xl font-bold">{eventos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Via motorista (app)</p>
            <p className="text-2xl font-bold">{eventosMotorista}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Via operador (ERP)</p>
            <p className="text-2xl font-bold">{eventosOperador}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ocorrências abertas</p>
            <p className="text-2xl font-bold text-amber-600">{ocorrenciasAbertas}</p>
          </CardContent>
        </Card>
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
            variant="auditoria"
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
