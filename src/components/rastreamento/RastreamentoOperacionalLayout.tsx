import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Viagem } from "@/types";
import type { MarcadorViagemOverview } from "@/lib/rastreamento-overview";
import type { DadosMapaViagem } from "@/lib/rastreamento-mapa";
import { RastreamentoOverviewMap } from "@/components/rastreamento/RastreamentoOverviewMap";
import { ViagemProgressoCard } from "@/components/viagem/ViagemProgressoCard";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { ViagemRouteLabel } from "@/components/operacional/ViagemRouteLabel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  marcadores: MarcadorViagemOverview[];
  viagens: Viagem[];
  selecionadaId: string | null;
  onSelecionar: (id: string) => void;
  dadosMapa: DadosMapaViagem | null;
  motoristas: { id: string; nome: string }[];
  veiculos: { id: string; placa: string }[];
  clientes: { id: string; nome: string }[];
};

export function RastreamentoOperacionalLayout({
  marcadores,
  viagens,
  selecionadaId,
  onSelecionar,
  dadosMapa,
  motoristas,
  veiculos,
  clientes,
}: Props) {
  const viagemSelecionada = viagens.find((v) => v.id === selecionadaId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-12rem)]">
      <div className="flex-1 min-h-[420px] lg:min-h-0 lg:h-[calc(100vh-12rem)]">
        <RastreamentoOverviewMap
          marcadores={marcadores}
          selecionadaId={selecionadaId}
          onSelecionar={onSelecionar}
          className="h-full min-h-[420px] w-full rounded-2xl border shadow-card"
        />
      </div>

      <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4 max-h-[calc(100vh-12rem)]">
        {dadosMapa && viagemSelecionada && (
          <ViagemProgressoCard progresso={dadosMapa.progresso} compact />
        )}

        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-2 shrink-0 border-b">
            <CardTitle className="text-base">Viagens ativas ({viagens.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {viagens.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma viagem rastreável.</p>
            ) : (
              <ul className="divide-y">
                {viagens.map((v) => {
                  const m = motoristas.find((x) => x.id === v.motorista_id);
                  const ve = veiculos.find((x) => x.id === v.veiculo_principal_id);
                  const co = clientes.find((c) => c.id === v.cliente_origem_id);
                  const cd = clientes.find((c) => c.id === v.cliente_destino_id);
                  const marcador = marcadores.find((mk) => mk.viagemId === v.id);
                  const selected = v.id === selecionadaId;

                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => onSelecionar(v.id)}
                        className={cn(
                          "w-full text-left p-4 transition-colors hover:bg-muted/60",
                          selected && "bg-blue-50/80 border-l-4 border-l-brand-orange",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-mono font-bold text-brand-blue">
                            #{String(v.numero_viagem).padStart(5, "0")}
                          </span>
                          <ViagemStatusBadge status={v.status} size="sm" />
                        </div>
                        <ViagemRouteLabel
                          origem={co?.nome ?? v.endereco_origem.cidade}
                          destino={cd?.nome ?? v.endereco_destino.cidade}
                          compact
                          className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {m?.nome ?? "—"} · {ve?.placa ?? "—"}
                        </p>
                        {marcador?.registradoEm && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Atualizado{" "}
                            {formatDistanceToNow(new Date(marcador.registradoEm), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        <Link
                          to="/viagens/$id"
                          params={{ id: v.id }}
                          className="text-xs text-primary font-medium mt-2 inline-block hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Abrir detalhe →
                        </Link>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
