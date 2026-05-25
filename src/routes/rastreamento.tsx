import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { Button } from "@/components/ui/button";
import {
  useViagens,
  useMotoristas,
  useVeiculos,
  useClientes,
  useAllViagemLocalizacoes,
} from "@/data/store";
import { MapPin, Route as RouteIcon, Radio } from "lucide-react";
import { STATUS_VIAGEM } from "@/types";
import { ViagemRastreamentoMap } from "@/components/rastreamento/ViagemRastreamentoMap";
import { RastreamentoOverviewMap } from "@/components/rastreamento/RastreamentoOverviewMap";
import { ViagemProgressoCard } from "@/components/viagem/ViagemProgressoCard";
import { montarDadosMapaViagem } from "@/lib/rastreamento-mapa";
import { listarMarcadoresRastreaveis } from "@/lib/rastreamento-overview";
import { calcularProgressoViagem, formatarDuracao, formatarDataHora } from "@/lib/viagem-progresso";
import { filtrarViagensRastreaveis } from "@/lib/viagem-rastreamento";
import { useRastreamentoRealtime } from "@/hooks/use-viagem-localizacoes-realtime";
import { cn } from "@/lib/utils";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";

export const Route = createFileRoute("/rastreamento")({
  head: () => ({
    meta: [
      { title: "Rastreamento — ERP Transportadora" },
      { name: "description", content: "Mapa em tempo real das viagens em andamento." },
    ],
  }),
  component: Page,
});

function Page() {
  useRastreamentoRealtime();
  const { data: viagens = [] } = useViagens();
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: clientes = [] } = useClientes();
  const { data: localizacoes = [] } = useAllViagemLocalizacoes();

  const ativas = filtrarViagensRastreaveis(viagens);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);

  const list = useListControls({
    items: ativas,
    searchFn: (v, q) => {
      const co = clientes.find((c) => c.id === v.cliente_origem_id);
      const cd = clientes.find((c) => c.id === v.cliente_destino_id);
      const m = motoristas.find((x) => x.id === v.motorista_id);
      const ve = veiculos.find((x) => x.id === v.veiculo_principal_id);
      const statusLabel = STATUS_VIAGEM.find((s) => s.value === v.status)?.label;
      return matchesAny([v.numero_viagem, co?.nome, cd?.nome, m?.nome, ve?.placa, statusLabel, v.status], q);
    },
    filterFn: (v, f) => !f.status || f.status === FILTER_ALL || v.status === f.status,
    initialFilters: { status: FILTER_ALL },
  });

  useEffect(() => {
    if (list.filtered.length === 0) {
      setSelecionadaId(null);
      return;
    }
    if (!selecionadaId || !list.filtered.some((v) => v.id === selecionadaId)) {
      setSelecionadaId(list.filtered[0].id);
    }
  }, [list.filtered, selecionadaId]);

  const viagemSelecionada = list.filtered.find((v) => v.id === selecionadaId) ?? ativas.find((v) => v.id === selecionadaId);

  const dadosMapa = useMemo(() => {
    if (!viagemSelecionada) return null;
    return montarDadosMapaViagem(
      viagemSelecionada,
      localizacoes,
      motoristas.find((m) => m.id === viagemSelecionada.motorista_id),
      veiculos.find((ve) => ve.id === viagemSelecionada.veiculo_principal_id),
      clientes.find((c) => c.id === viagemSelecionada.cliente_origem_id),
      clientes.find((c) => c.id === viagemSelecionada.cliente_destino_id),
    );
  }, [viagemSelecionada, localizacoes, motoristas, veiculos, clientes]);

  const marcadoresOverview = useMemo(
    () => listarMarcadoresRastreaveis(list.filtered, localizacoes, motoristas, veiculos),
    [list.filtered, localizacoes, motoristas, veiculos],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rastreamento</h1>
          <p className="text-sm text-muted-foreground">
            Ponto A, ponto B, rota planejada, histórico percorrido, ETA e progresso da viagem.
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
            <Radio className="h-3.5 w-3.5" />
            Atualização em tempo real
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/viagens">
            <RouteIcon className="h-4 w-4 mr-2" />
            Viagens
          </Link>
        </Button>
      </div>

      {dadosMapa && <ViagemProgressoCard progresso={dadosMapa.progresso} />}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Frota no mapa ({marcadoresOverview.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <RastreamentoOverviewMap
            marcadores={marcadoresOverview}
            selecionadaId={selecionadaId}
            onSelecionar={setSelecionadaId}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Toque em um marcador para selecionar a viagem no mapa detalhado abaixo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            Mapa operacional
            {viagemSelecionada && (
              <Badge variant="outline" className="ml-2 font-mono font-normal">
                #{String(viagemSelecionada.numero_viagem).padStart(5, "0")}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ViagemRastreamentoMap dados={dadosMapa} />
          {dadosMapa && !dadosMapa.posicaoAtual && dadosMapa.progresso.aguardandoInicio && (
            <p className="text-xs text-muted-foreground mt-2">
              Rota planejada exibida · veículo ainda sem posição GPS (status:{" "}
              {STATUS_VIAGEM.find((s) => s.value === dadosMapa.viagem.status)?.label?.toLowerCase()})
            </p>
          )}
          {dadosMapa?.posicaoAtual && (
            <p className="text-xs text-muted-foreground mt-2">
              Posição atual: {dadosMapa.posicaoAtual[0].toFixed(5)}, {dadosMapa.posicaoAtual[1].toFixed(5)}
              {dadosMapa.ultimaVelocidade != null && ` · ${dadosMapa.ultimaVelocidade} km/h`}
              {" · "}
              {dadosMapa.progresso.percentualConcluido.toFixed(1)}% concluído
              {dadosMapa.progresso.emAndamento && (
                <> · restam {Math.round(dadosMapa.progresso.tempoRestanteMinutos)} min</>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Viagens rastreáveis ({list.totalItems})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Buscar viagem, motorista, placa…"
            totalItems={list.totalItems}
            page={list.page}
            pageSize={list.pageSize}
          >
            <ListFilterSelect
              label="Status"
              value={list.filters.status ?? FILTER_ALL}
              onChange={(v) => list.setFilter("status", v)}
              options={STATUS_VIAGEM.filter((s) => s.value !== "finalizada" && s.value !== "cancelada").map((s) => ({ value: s.value, label: s.label }))}
            />
          </ListToolbar>
          <div className="space-y-2">
          {list.totalItems === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {list.hasActiveFilters ? "Nenhuma viagem encontrada." : "Nenhuma viagem em andamento para rastrear."}
            </p>
          )}
          {list.paginated.map((v) => {
            const m = motoristas.find((x) => x.id === v.motorista_id);
            const ve = veiculos.find((x) => x.id === v.veiculo_principal_id);
            const co = clientes.find((c) => c.id === v.cliente_origem_id);
            const cd = clientes.find((c) => c.id === v.cliente_destino_id);
            const selecionada = v.id === selecionadaId;
            const prog = calcularProgressoViagem(v, localizacoes.filter((l) => l.viagem_id === v.id));
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelecionadaId(v.id)}
                className={cn(
                  "w-full text-left rounded-md border p-4 flex flex-wrap items-start justify-between gap-3 transition-colors",
                  selecionada ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50",
                )}
              >
                <div>
                  <p className="font-mono font-semibold">#{String(v.numero_viagem).padStart(5, "0")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {co?.nome ?? v.endereco_origem?.cidade ?? "Origem"} → {cd?.nome ?? v.endereco_destino?.cidade ?? "Destino"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Motorista: {m?.nome ?? "—"} · Veículo: {ve?.placa ?? "—"}
                  </p>
                  {prog.emAndamento ? (
                    <p className="text-xs mt-1">
                      <span className="font-medium text-primary">{prog.percentualConcluido.toFixed(0)}%</span>
                      {" · "}
                      restam {formatarDuracao(prog.tempoRestanteMinutos)}
                    </p>
                  ) : prog.aguardandoInicio ? (
                    <p className="text-xs mt-1 text-muted-foreground">
                      Rota planejada · {prog.distanciaTotalKm.toLocaleString("pt-BR")} km
                      {prog.previsaoChegadaAgendada && (
                        <> · chegada prev. {formatarDataHora(prog.previsaoChegadaAgendada)}</>
                      )}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <ViagemStatusBadge status={v.status} />
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to="/viagens/$id" params={{ id: v.id }}>Detalhes</Link>
                  </Button>
                </div>
              </button>
            );
          })}
          </div>
          <ListPagination page={list.page} totalPages={list.totalPages} totalItems={list.totalItems} onPageChange={list.setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
