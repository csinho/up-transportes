import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ViagemEvento } from "@/types";
import { STATUS_VIAGEM, TIPOS_VIAGEM_EVENTO } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CircleDot, FileText, MapPin, AlertTriangle, Truck, Package, Clock, Flag } from "lucide-react";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";

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

const ORIGEM_LABEL: Record<string, string> = {
  sistema: "Sistema",
  motorista: "Motorista",
  operador: "Operador",
};

export function ViagemEventosTimeline({ eventos }: { eventos: ViagemEvento[] }) {
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
        Nenhum evento registrado para esta viagem.
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
      <div className="space-y-0">
      {list.paginated.map((ev, i) => {
        const Icon = ICONS[ev.tipo] ?? CircleDot;
        const tipoLabel = TIPOS_VIAGEM_EVENTO.find((t) => t.value === ev.tipo)?.label ?? ev.tipo;
        return (
          <div key={ev.id} className="flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 rounded-full border bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {i < list.paginated.length - 1 && <div className="w-px flex-1 bg-border mt-2 min-h-[24px]" />}
            </div>
            <div className="flex-1 pt-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{ev.titulo}</p>
                <Badge variant="outline" className="text-xs">{tipoLabel}</Badge>
                <Badge variant="secondary" className="text-xs">{ORIGEM_LABEL[ev.origem]}</Badge>
              </div>
              {ev.descricao && (
                <p className="text-sm text-muted-foreground mt-1">{ev.descricao}</p>
              )}
              {ev.status_novo && (
                <p className="text-xs text-muted-foreground mt-1">
                  Status:{" "}
                  {ev.status_anterior && (
                    <>
                      {STATUS_VIAGEM.find((s) => s.value === ev.status_anterior)?.label} →{" "}
                    </>
                  )}
                  <span className="font-medium text-foreground">
                    {STATUS_VIAGEM.find((s) => s.value === ev.status_novo)?.label}
                  </span>
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {format(new Date(ev.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        );
      })}
      </div>
      <ListPagination page={list.page} totalPages={list.totalPages} totalItems={list.totalItems} onPageChange={list.setPage} />
    </div>
  );
}
