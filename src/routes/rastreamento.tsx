import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/operacional/PageHeader";
import {
  useViagens,
  useMotoristas,
  useVeiculos,
  useClientes,
  useAllViagemLocalizacoes,
} from "@/data/store";
import { Route as RouteIcon, Radio } from "lucide-react";
import { RastreamentoOperacionalLayout } from "@/components/rastreamento/RastreamentoOperacionalLayout";
import { montarDadosMapaViagem } from "@/lib/rastreamento-mapa";
import { listarMarcadoresRastreaveis } from "@/lib/rastreamento-overview";
import { filtrarViagensRastreaveis } from "@/lib/viagem-rastreamento";
import { useRastreamentoRealtime } from "@/hooks/use-viagem-localizacoes-realtime";
import { useListControls } from "@/hooks/use-list-controls";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";
import { STATUS_VIAGEM } from "@/types";

export const Route = createFileRoute("/rastreamento")({
  head: () => ({
    meta: [
      { title: "Rastreamento — Mapa da Carga" },
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
      <PageHeader
        title="Rastreamento"
        description="Mapa operacional com frota ativa, seleção de viagem e progresso em tempo real."
        actions={
          <Button variant="outline" asChild>
            <Link to="/viagens">
              <RouteIcon className="h-4 w-4 mr-2" />
              Viagens
            </Link>
          </Button>
        }
      />
      <p className="text-xs text-brand-success flex items-center gap-1.5 -mt-4">
        <Radio className="h-3.5 w-3.5" />
        Atualização em tempo real · {list.filtered.length} viagem{list.filtered.length !== 1 ? "ns" : ""} rastreável{list.filtered.length !== 1 ? "is" : ""}
      </p>

      <RastreamentoOperacionalLayout
        marcadores={marcadoresOverview}
        viagens={list.filtered}
        selecionadaId={selecionadaId}
        onSelecionar={setSelecionadaId}
        dadosMapa={dadosMapa}
        motoristas={motoristas}
        veiculos={veiculos}
        clientes={clientes}
      />
    </div>
  );
}
