import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useMotoristas,
  useVeiculos,
  useViagens,
  useAllViagemOcorrencias,
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
      { title: "Dashboard — ERP Transportadora" },
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
  "em_descarga",
  "com_ocorrencia",
] as const;

const STATUS_FINAL = ["finalizada", "cancelada"] as const;

function Dashboard() {
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: viagens = [] } = useViagens();
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard operacional</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe viagens, motoristas e pendências da operação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/auditoria">Ver auditoria</Link>
          </Button>
          <Button asChild>
            <Link to="/viagens">
              <RouteIcon className="h-4 w-4 mr-2" />
              Gerenciar viagens
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={RouteIcon} label="Em andamento" value={emAndamento.length} highlight />
        <StatCard icon={CalendarClock} label="Planejadas" value={planejadas.length} />
        <StatCard icon={Clock} label="Atrasadas" value={atrasadas.length} alert={atrasadas.length > 0} />
        <StatCard icon={Radio} label="Motoristas online*" value={motoristasEmViagem.length} />
        <StatCard icon={AlertTriangle} label="Ocorrências" value={comOcorrencia.length} alert={comOcorrencia.length > 0} />
        <StatCard icon={FileWarning} label="Docs pendentes" value={docsPendentes.length} alert={docsPendentes.length > 0} />
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
            {listEmAndamento.paginated.map((v) => (
              <Link
                key={v.id}
                to="/viagens/$id"
                params={{ id: v.id }}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-medium">#{String(v.numero_viagem).padStart(5, "0")}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.endereco_origem?.cidade ?? "—"} → {v.endereco_destino?.cidade ?? "—"}
                  </p>
                </div>
                <Badge variant="secondary">
                  {STATUS_VIAGEM.find((s) => s.value === v.status)?.label}
                </Badge>
              </Link>
            ))}
            </div>
            <ListPagination page={listEmAndamento.page} totalPages={listEmAndamento.totalPages} totalItems={listEmAndamento.totalItems} onPageChange={listEmAndamento.setPage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo operacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <AlertRow label="Alertas ativos" value={alertas.length} />
            <AlertRow label="Viagens atrasadas" value={atrasadas.length} />
            <AlertRow label="Viagens com ocorrência" value={comOcorrencia.length} />
            <AlertRow label="Documentos pendentes em viagens ativas" value={docsPendentes.length} />
            <AlertRow label="Motoristas disponíveis" value={motoristasDisponiveis.length} />
            <AlertRow label="Veículos em viagem" value={veiculosEmViagem.length} />
            <AlertRow label="Viagens planejadas (próximas)" value={planejadas.length} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Rastreamento
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/rastreamento">Abrir mapa</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Acompanhe posições em tempo real na rota{" "}
            <Link to="/rastreamento" className="underline">
              /rastreamento
            </Link>
            . Alterações feitas pelo motorista no app aparecem automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
  alert,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${alert ? "text-amber-600" : ""}`}>{value}</p>
          </div>
          <Icon className={`h-6 w-6 ${alert ? "text-amber-500" : "text-muted-foreground"}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function AlertRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between rounded-md border p-2">
      <span>{label}</span>
      <span className={`font-semibold ${value > 0 ? "text-amber-600" : ""}`}>{value}</span>
    </div>
  );
}
