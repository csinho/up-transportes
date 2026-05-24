import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transportadora, Viagem, ViagemEvento } from "@/types";
import { STATUS_VIAGEM, TIPOS_VIAGEM_EVENTO } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";
import { ViagemEventosTimeline } from "@/components/viagem/ViagemEventosTimeline";
import { AuditoriaExportButtons } from "@/components/auditoria/AuditoriaExportButtons";
import { exportEventosCsv, exportEventosPdf } from "@/lib/auditoria-export";
import { toast } from "sonner";

const ORIGEM_LABEL: Record<string, string> = {
  sistema: "Sistema",
  motorista: "Motorista",
  operador: "Operador",
};

type Props = {
  eventos: ViagemEvento[];
  viagens: Viagem[];
  transportadora?: Transportadora;
  variant?: "timeline" | "auditoria";
};

export function AuditoriaEventosList({
  eventos,
  viagens,
  transportadora,
  variant = "auditoria",
}: Props) {
  const viagemPorId = new Map(viagens.map((v) => [v.id, v]));

  const list = useListControls({
    items: eventos,
    searchFn: (ev, q) => {
      const v = viagemPorId.get(ev.viagem_id);
      return matchesAny(
        [
          ev.titulo,
          ev.descricao,
          ev.tipo,
          ev.origem,
          v?.numero_viagem,
          TIPOS_VIAGEM_EVENTO.find((t) => t.value === ev.tipo)?.label,
        ],
        q,
      );
    },
    filterFn: (ev, f) => {
      if (f.tipo && f.tipo !== FILTER_ALL && ev.tipo !== f.tipo) return false;
      if (f.origem && f.origem !== FILTER_ALL && ev.origem !== f.origem) return false;
      return true;
    },
    initialFilters: { tipo: FILTER_ALL, origem: FILTER_ALL },
  });

  const exportar = (tipo: "csv" | "pdf") => {
    const meta = { transportadora, filtrado: list.hasActiveFilters };
    try {
      if (tipo === "csv") exportEventosCsv(list.filtered, viagens, meta);
      else exportEventosPdf(list.filtered, viagens, meta);
      toast.success(tipo === "csv" ? "CSV baixado!" : "PDF gerado!");
    } catch {
      toast.error(`Falha ao gerar ${tipo.toUpperCase()}.`);
    }
  };

  if (variant === "timeline") {
    return <ViagemEventosTimeline eventos={eventos} />;
  }

  if (eventos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum evento registrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {list.totalItems} registro{list.totalItems !== 1 ? "s" : ""}
          {list.hasActiveFilters ? " (filtros ativos)" : ""}
        </p>
        <AuditoriaExportButtons
          itemCount={list.totalItems}
          onCsv={() => exportar("csv")}
          onPdf={() => exportar("pdf")}
        />
      </div>

      <ListToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        placeholder="Buscar por viagem, título, tipo…"
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
        <ListFilterSelect
          label="Origem"
          value={list.filters.origem ?? FILTER_ALL}
          onChange={(v) => list.setFilter("origem", v)}
          options={[
            { value: "motorista", label: "Motorista" },
            { value: "operador", label: "Operador" },
            { value: "sistema", label: "Sistema" },
          ]}
        />
      </ListToolbar>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Data/hora</th>
                <th className="p-3 font-medium">Viagem</th>
                <th className="p-3 font-medium">Evento</th>
                <th className="p-3 font-medium">Origem</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.paginated.map((ev) => {
                const v = viagemPorId.get(ev.viagem_id);
                const tipoLabel =
                  TIPOS_VIAGEM_EVENTO.find((t) => t.value === ev.tipo)?.label ?? ev.tipo;
                return (
                  <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {format(new Date(ev.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {v ? (
                        <Link
                          to="/viagens/$id"
                          params={{ id: v.id }}
                          className="font-mono text-primary hover:underline"
                        >
                          #{String(v.numero_viagem).padStart(5, "0")}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 min-w-[200px]">
                      <p className="font-medium">{ev.titulo}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {tipoLabel}
                        </Badge>
                      </div>
                      {ev.descricao && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {ev.descricao}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{ORIGEM_LABEL[ev.origem] ?? ev.origem}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {ev.status_novo ? (
                        <>
                          {ev.status_anterior &&
                            `${STATUS_VIAGEM.find((s) => s.value === ev.status_anterior)?.label} → `}
                          {STATUS_VIAGEM.find((s) => s.value === ev.status_novo)?.label}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ListPagination
        page={list.page}
        totalPages={list.totalPages}
        totalItems={list.totalItems}
        onPageChange={list.setPage}
      />
    </div>
  );
}
