import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";
import type { Viagem, ViagemEvento } from "@/types";
import { TIPOS_VIAGEM_EVENTO } from "@/types";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { Badge } from "@/components/ui/badge";
import { CircleDot, FileText, MapPin, AlertTriangle, Truck, Package, Clock, Flag } from "lucide-react";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  viagem_criada: CircleDot,
  status_alterado: Clock,
  saida_origem: Truck,
  chegada_destino: MapPin,
  parada: Clock,
  retomada: Truck,
  carregamento_inicio: Package,
  carregamento_fim: Package,
  descarga_inicio: Package,
  descarga_fim: Package,
  documento_anexado: FileText,
  ocorrencia_registrada: AlertTriangle,
  localizacao_enviada: MapPin,
  observacao: CircleDot,
  viagem_finalizada: Flag,
};

const DOT_STYLES: Record<string, { dot: string; ring: string }> = {
  ocorrencia_registrada: { dot: "bg-brand-danger", ring: "ring-red-200" },
  viagem_finalizada: { dot: "bg-brand-success", ring: "ring-green-200" },
  status_alterado: { dot: "bg-brand-blue", ring: "ring-blue-200" },
  localizacao_enviada: { dot: "bg-brand-orange", ring: "ring-orange-200" },
};

const DEFAULT_DOT = { dot: "bg-muted-foreground/60", ring: "ring-border" };

const ORIGEM_LABEL: Record<string, string> = {
  sistema: "Sistema",
  motorista: "Motorista",
  operador: "Operador",
};

type Props = {
  eventos: ViagemEvento[];
  viagens?: Viagem[];
  showViagemLink?: boolean;
};

export function ViagemEventosTimeline({ eventos, viagens, showViagemLink }: Props) {
  const viagemPorId = new Map((viagens ?? []).map((v) => [v.id, v]));

  const list = useListControls({
    items: eventos,
    searchFn: (ev, q) =>
      matchesAny(
        [ev.titulo, ev.descricao, ev.tipo, ev.origem, TIPOS_VIAGEM_EVENTO.find((t) => t.value === ev.tipo)?.label, ev.status_novo, ev.status_anterior],
        q,
      ),
    filterFn: (ev, f) => !f.tipo || f.tipo === FILTER_ALL || ev.tipo === f.tipo,
    initialFilters: { tipo: FILTER_ALL },
  });

  if (eventos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum evento registrado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ListToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        placeholder="Buscar evento…"
        totalItems={list.totalItems}
        page={list.page}
        pageSize={list.pageSize}
      >
        <ListFilterSelect
          label="Tipo"
          value={list.filters.tipo ?? FILTER_ALL}
          onChange={(v) => list.setFilter("tipo", v)}
          options={TIPOS_VIAGEM_EVENTO.map((t) => ({ value: t.value, label: t.label }))}
        />
      </ListToolbar>
      <div className="relative pl-2">
      {list.paginated.map((ev, i) => {
        const Icon = ICONS[ev.tipo] ?? CircleDot;
        const tipoLabel = TIPOS_VIAGEM_EVENTO.find((t) => t.value === ev.tipo)?.label ?? ev.tipo;
        const dotStyle = DOT_STYLES[ev.tipo] ?? DEFAULT_DOT;
        const viagem = viagemPorId.get(ev.viagem_id);
        const isHighlight = ev.tipo === "ocorrencia_registrada" || ev.tipo === "viagem_finalizada";
        const isLast = i === list.paginated.length - 1;

        return (
          <div key={ev.id} className="flex gap-4 items-center pb-8 last:pb-0 relative">
            {!isLast && (
              <div
                className="absolute left-[17px] top-[calc(50%+1.125rem)] bottom-0 w-px bg-border"
                aria-hidden
              />
            )}
            <div className="flex flex-col items-center shrink-0 z-10 self-center">
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center ring-4 bg-card border",
                  dotStyle.ring,
                  isHighlight && ev.tipo === "ocorrencia_registrada" && "border-destructive/40 bg-destructive/5",
                  isHighlight && ev.tipo === "viagem_finalizada" && "border-green-500/40 bg-green-50",
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", dotStyle.dot)} />
              </div>
            </div>
            <div className="flex-1 min-w-0 rounded-xl border bg-card px-4 py-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col justify-center gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="font-medium text-sm leading-snug">{ev.titulo}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {tipoLabel}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {ORIGEM_LABEL[ev.origem] ?? ev.origem}
                  </Badge>
                  {showViagemLink && viagem && (
                    <Link
                      to="/viagens/$id"
                      params={{ id: viagem.id }}
                      className="font-mono text-xs text-brand-blue font-bold hover:underline"
                    >
                      #{String(viagem.numero_viagem).padStart(5, "0")}
                    </Link>
                  )}
                </div>
                {ev.descricao && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{ev.descricao}</p>
                )}
                {ev.status_novo && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    {ev.status_anterior && (
                      <>
                        <ViagemStatusBadge status={ev.status_anterior} size="sm" />
                        <span className="text-xs text-muted-foreground">→</span>
                      </>
                    )}
                    <ViagemStatusBadge status={ev.status_novo} size="sm" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(ev.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      </div>
      <ListPagination page={list.page} totalPages={list.totalPages} totalItems={list.totalItems} onPageChange={list.setPage} />
    </div>
  );
}
