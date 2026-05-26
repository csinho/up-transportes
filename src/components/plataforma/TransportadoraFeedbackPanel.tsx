import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDocumentoUrl } from "@/hooks/use-documento-url";
import {
  usePlatformFeedbackDetail,
  usePlatformFeedbackList,
  useUpdatePlatformFeedbackStatus,
} from "@/hooks/use-plataforma-feedback";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import type { FeedbackAnexo, FeedbackImpacto, FeedbackStatus } from "@/types";
import {
  FEEDBACK_IMPACTO_LABELS,
  FEEDBACK_STATUS_LABELS,
} from "@/types";

const IMPACTO_VARIANT: Record<
  FeedbackImpacto,
  "secondary" | "outline" | "default" | "destructive"
> = {
  baixo: "secondary",
  medio: "outline",
  alto: "default",
  critico: "destructive",
};

type Props = {
  transportadoraId: string;
};

function AnexoPreview({ anexo }: { anexo: FeedbackAnexo }) {
  const url = useDocumentoUrl({
    storage_path: anexo.storage_path,
    arquivo_url: "",
  });
  const isVideo =
    anexo.mime_type?.startsWith("video/") || anexo.tipo === "gravacao";
  const isImage = anexo.mime_type?.startsWith("image/");

  if (!url) {
    return (
      <div className="rounded-lg border p-4 flex items-center justify-center min-h-[120px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {isVideo ? (
        <video src={url} controls className="w-full max-h-64 bg-black object-contain" />
      ) : isImage ? (
        <img src={url} alt={anexo.nome_arquivo} className="w-full max-h-64 object-contain bg-muted" />
      ) : (
        <div className="p-4 text-sm text-muted-foreground">{anexo.nome_arquivo}</div>
      )}
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-t bg-muted/30">
        <span className="text-xs truncate">{anexo.nome_arquivo}</span>
        <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Abrir
          </a>
        </Button>
      </div>
    </div>
  );
}

export function TransportadoraFeedbackPanel({ transportadoraId }: Props) {
  const { data = [], isPending, isError, error } = usePlatformFeedbackList(transportadoraId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail, isPending: detailPending } = usePlatformFeedbackDetail(selectedId ?? undefined);
  const updateStatus = useUpdatePlatformFeedbackStatus(transportadoraId);
  const [statusLocal, setStatusLocal] = useState<FeedbackStatus | "">("");

  const openDetail = (id: string) => {
    setSelectedId(id);
    setStatusLocal("");
  };

  const applyStatus = () => {
    if (!selectedId || !statusLocal) return;
    updateStatus.mutate(
      { id: selectedId, status: statusLocal },
      {
        onSuccess: () => toast.success("Status atualizado."),
        onError: (err) => toast.error(traduzirErroSupabase(err)),
      },
    );
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-4">{traduzirErroSupabase(error)}</p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Impacto</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Anexos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum feedback enviado por esta transportadora.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => openDetail(row.id)}
              >
                <TableCell className="text-sm whitespace-nowrap">
                  {format(new Date(row.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{row.titulo}</TableCell>
                <TableCell>
                  <Badge variant={IMPACTO_VARIANT[row.impacto]}>
                    {FEEDBACK_IMPACTO_LABELS[row.impacto]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <p className="truncate max-w-[160px]">{row.user_nome || row.user_email || "—"}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{FEEDBACK_STATUS_LABELS[row.status]}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.total_anexos}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailPending || !detail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{detail.titulo}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={IMPACTO_VARIANT[detail.impacto]}>
                    {FEEDBACK_IMPACTO_LABELS[detail.impacto]}
                  </Badge>
                  <Badge variant="outline">{FEEDBACK_STATUS_LABELS[detail.status]}</Badge>
                  <span className="text-muted-foreground">
                    {format(new Date(detail.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Autor</p>
                  <p>
                    {detail.user_nome || "—"}
                    {detail.user_email && (
                      <span className="text-muted-foreground"> ({detail.user_email})</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descrição</p>
                  <p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">{detail.descricao}</p>
                </div>

                {detail.pagina_url && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Página</p>
                    <a
                      href={detail.pagina_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-blue hover:underline break-all"
                    >
                      {detail.pagina_url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}

                {detail.user_agent && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Navegador</p>
                    <p className="text-xs text-muted-foreground break-all">{detail.user_agent}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-end gap-3 pt-2 border-t">
                  <div className="space-y-1 flex-1 min-w-[180px]">
                    <Label>Status</Label>
                    <Select
                      value={statusLocal || detail.status}
                      onValueChange={(v) => setStatusLocal(v as FeedbackStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {FEEDBACK_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      updateStatus.isPending ||
                      !(statusLocal && statusLocal !== detail.status)
                    }
                    onClick={applyStatus}
                  >
                    Salvar status
                  </Button>
                </div>

                {(detail.anexos?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Anexos ({detail.anexos!.length})
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {detail.anexos!.map((a) => (
                        <AnexoPreview key={a.id} anexo={a} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
