import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { getViagemStatusStyle } from "@/lib/viagem-status-styles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/operacional/PageHeader";
import { KpiCard } from "@/components/operacional/KpiCard";
import { ViagemRouteLabel } from "@/components/operacional/ViagemRouteLabel";
import {
  useMotoristas,
  useVeiculos,
  useViagens,
  useAllViagemOcorrencias,
  useClientes,
} from "@/data/store";
import { calcularAlertasOperacionais, viagemEstaAtrasada } from "@/lib/dashboard-alertas";
import { DashboardAlertasPanel } from "@/components/dashboard/DashboardAlertasPanel";
import {
  Route as RouteIcon,
  AlertTriangle,
  FileWarning,
  MapPin,
  Radio,
  Clock,
  CalendarClock,
} from "lucide-react";
import { STATUS_VIAGEM } from "@/types";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mapa da Carga" },
      { name: "description", content: "Painel operacional de viagens em tempo real." },
    ],
  }),
  component: Dashboard,
});

const STATUS_ATIVOS = [
  "aguardando_carregamento",
  "em_carregamento",
  "em_transito",
  "parada",
  "aguardando_descarga",
  "em_descarga",
  "com_ocorrencia",
] as const;

const STATUS_FINAL = ["finalizada", "cancelada"] as const;

function Dashboard() {
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: viagens = [] } = useViagens();
  const { data: clientes = [] } = useClientes();
  const { data: ocorrencias = [] } = useAllViagemOcorrencias();

  const alertas = calcularAlertasOperacionais(viagens, ocorrencias);

  const emAndamento = viagens.filter((v) => STATUS_ATIVOS.includes(v.status as (typeof STATUS_ATIVOS)[number]));
  const planejadas = viagens.filter((v) => v.status === "planejada");
  const atrasadas = viagens.filter(viagemEstaAtrasada);
  const comOcorrencia = viagens.filter((v) => v.status === "com_ocorrencia");
  const docsPendentes = viagens.filter(
    (v) =>
      !STATUS_FINAL.includes(v.status as (typeof STATUS_FINAL)[number]) &&
      (v.documentos?.length ?? 0) === 0,
  );

  const motoristasEmViagem = motoristas.filter((m) => m.status === "em_viagem");
  const motoristasDisponiveis = motoristas.filter((m) => m.status === "disponivel");
  const veiculosEmViagem = veiculos.filter((v) => v.status === "em_viagem");

  const listEmAndamento = useListControls({
    items: emAndamento,
    searchFn: (v, q) =>
      matchesAny(
        [v.numero_viagem, v.endereco_origem?.cidade, v.endereco_destino?.cidade, STATUS_VIAGEM.find((s) => s.value === v.status)?.label, v.status],
        q,
      ),
    filterFn: (v, f) => !f.status || f.status === FILTER_ALL || v.status === f.status,
    initialFilters: { status: FILTER_ALL },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard operacional"
        description="Acompanhe viagens, motoristas e pendências da operação em tempo real."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/auditoria">Ver auditoria</Link>
            </Button>
            <Button asChild>
              <Link to="/viagens">
                <RouteIcon className="h-4 w-4 mr-2" />
                Gerenciar viagens
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={RouteIcon} label="Em andamento" value={emAndamento.length} accent="blue" />
        <KpiCard icon={CalendarClock} label="Planejadas" value={planejadas.length} accent="navy" />
        <KpiCard icon={Clock} label="Atrasadas" value={atrasadas.length} accent="amber" alert={atrasadas.length > 0} />
        <KpiCard icon={Radio} label="Motoristas em viagem" value={motoristasEmViagem.length} accent="green" />
        <KpiCard icon={AlertTriangle} label="Ocorrências" value={comOcorrencia.length} accent="red" alert={comOcorrencia.length > 0} />
        <KpiCard icon={FileWarning} label="Docs pendentes" value={docsPendentes.length} accent="amber" alert={docsPendentes.length > 0} />
      </div>

      <DashboardAlertasPanel alertas={alertas} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Viagens em andamento</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/rastreamento">Ver no mapa</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListToolbar
              search={listEmAndamento.search}
              onSearchChange={listEmAndamento.setSearch}
              placeholder="Buscar viagem em andamento…"
              totalItems={listEmAndamento.totalItems}
              page={listEmAndamento.page}
              pageSize={listEmAndamento.pageSize}
            >
              <ListFilterSelect
                label="Status"
                value={listEmAndamento.filters.status ?? FILTER_ALL}
                onChange={(v) => listEmAndamento.setFilter("status", v)}
                options={STATUS_VIAGEM.filter((s) => STATUS_ATIVOS.includes(s.value as (typeof STATUS_ATIVOS)[number])).map((s) => ({ value: s.value, label: s.label }))}
              />
            </ListToolbar>
            <div className="space-y-2">
            {listEmAndamento.totalItems === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma viagem em andamento.</p>
            )}
            {listEmAndamento.paginated.map((v) => {
              const co = clientes.find((c) => c.id === v.cliente_origem_id);
              const cd = clientes.find((c) => c.id === v.cliente_destino_id);
              return (
              <Link
                key={v.id}
                to="/viagens/$id"
                params={{ id: v.id }}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 bg-card hover:bg-white hover:shadow-md transition-all",
                  getViagemStatusStyle(v.status).accentLeft,
                )}
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-sm font-bold text-brand-blue">#{String(v.numero_viagem).padStart(5, "0")}</p>
                  <ViagemRouteLabel
                    origem={co?.nome ?? v.endereco_origem?.cidade ?? "—"}
                    destino={cd?.nome ?? v.endereco_destino?.cidade ?? "—"}
                    compact
                  />
                </div>
                <ViagemStatusBadge status={v.status} />
              </Link>
            );
            })}
            </div>
            <ListPagination page={listEmAndamento.page} totalPages={listEmAndamento.totalPages} totalItems={listEmAndamento.totalItems} onPageChange={listEmAndamento.setPage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <AlertRow label="Alertas ativos" value={alertas.length} warn={alertas.length > 0} />
            <AlertRow label="Viagens atrasadas" value={atrasadas.length} warn={atrasadas.length > 0} />
            <AlertRow label="Viagens com ocorrência" value={comOcorrencia.length} warn={comOcorrencia.length > 0} />
            <AlertRow label="Documentos pendentes em viagens ativas" value={docsPendentes.length} warn={docsPendentes.length > 0} />
            <AlertRow label="Motoristas disponíveis" value={motoristasDisponiveis.length} />
            <AlertRow label="Veículos em viagem" value={veiculosEmViagem.length} />
            <AlertRow label="Viagens planejadas (próximas)" value={planejadas.length} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-l-brand-blue">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-blue" />
            Rastreamento
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/rastreamento">Abrir mapa</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acompanhe posições em tempo real na rota{" "}
            <Link to="/rastreamento" className="text-primary font-medium hover:underline">
              /rastreamento
            </Link>
            . Alterações feitas pelo motorista no app aparecem automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertRow({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={cn("flex justify-between rounded-lg border p-3", warn && "border-l-4 border-l-amber-500 bg-amber-50/50")}>
      <span>{label}</span>
      <span className={cn("font-semibold tabular-nums", warn && value > 0 && "text-amber-600")}>{value}</span>
    </div>
  );
}
