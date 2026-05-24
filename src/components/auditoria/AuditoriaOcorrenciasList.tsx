import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transportadora, Viagem, ViagemOcorrencia } from "@/types";
import { GRAVIDADE_OCORRENCIA, STATUS_OCORRENCIA, TIPOS_VIAGEM_OCORRENCIA } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListPagination } from "@/components/list/ListPagination";
import { matchesAny } from "@/lib/list-utils";
import { AuditoriaExportButtons } from "@/components/auditoria/AuditoriaExportButtons";
import { exportOcorrenciasCsv, exportOcorrenciasPdf } from "@/lib/auditoria-export";
import { toast } from "sonner";

type Props = {
  ocorrencias: ViagemOcorrencia[];
  viagens: Viagem[];
  transportadora?: Transportadora;
};

export function AuditoriaOcorrenciasList({ ocorrencias, viagens, transportadora }: Props) {
  const viagemPorId = new Map(viagens.map((v) => [v.id, v]));

  const list = useListControls({
    items: ocorrencias,
    searchFn: (oc, q) => {
      const v = viagemPorId.get(oc.viagem_id);
      return matchesAny([oc.titulo, oc.descricao, oc.tipo, v?.numero_viagem], q);
    },
    filterFn: () => true,
    initialFilters: {},
  });

  const exportar = (tipo: "csv" | "pdf") => {
    const meta = { transportadora, filtrado: list.hasActiveFilters };
    try {
      if (tipo === "csv") exportOcorrenciasCsv(list.filtered, viagens, meta);
      else exportOcorrenciasPdf(list.filtered, viagens, meta);
      toast.success(tipo === "csv" ? "CSV baixado!" : "PDF gerado!");
    } catch {
      toast.error(`Falha ao gerar ${tipo.toUpperCase()}.`);
    }
  };

  if (ocorrencias.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Nenhuma ocorrência registrada.
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
        placeholder="Buscar ocorrência…"
        totalItems={list.totalItems}
        page={list.page}
        pageSize={list.pageSize}
      />

      {list.totalItems === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhuma ocorrência encontrada com os filtros atuais.
        </p>
      ) : (
        <div className="space-y-2">
          {list.paginated.map((oc) => {
            const v = viagemPorId.get(oc.viagem_id);
            return (
              <div
                key={oc.id}
                className="rounded-md border p-3 flex flex-wrap items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {v && (
                      <Link
                        to="/viagens/$id"
                        params={{ id: v.id }}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        #{String(v.numero_viagem).padStart(5, "0")}
                      </Link>
                    )}
                    <p className="font-medium text-sm">{oc.titulo}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{oc.descricao}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(oc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">
                    {TIPOS_VIAGEM_OCORRENCIA.find((t) => t.value === oc.tipo)?.label}
                  </Badge>
                  <Badge
                    variant={
                      oc.gravidade === "critica" || oc.gravidade === "alta"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {GRAVIDADE_OCORRENCIA.find((g) => g.value === oc.gravidade)?.label}
                  </Badge>
                  <Badge variant="secondary">
                    {STATUS_OCORRENCIA.find((s) => s.value === oc.status)?.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ListPagination
        page={list.page}
        totalPages={list.totalPages}
        totalItems={list.totalItems}
        onPageChange={list.setPage}
      />
    </div>
  );
}
