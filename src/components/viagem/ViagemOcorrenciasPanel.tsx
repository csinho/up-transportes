import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ViagemOcorrencia, TipoViagemOcorrencia, GravidadeOcorrencia } from "@/types";
import { GRAVIDADE_OCORRENCIA, STATUS_OCORRENCIA, TIPOS_VIAGEM_OCORRENCIA } from "@/types";
import { useSaveViagemOcorrencia, useSaveViagemEvento, useActiveTenantId } from "@/data/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, MapPin } from "lucide-react";
import { toast } from "sonner";
import { generateUuid } from "@/lib/uuid";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";
import { cn } from "@/lib/utils";

const GRAVIDADE_VARIANT: Record<GravidadeOcorrencia, "secondary" | "default" | "destructive" | "outline"> = {
  baixa: "secondary",
  media: "default",
  alta: "destructive",
  critica: "destructive",
};

export function ViagemOcorrenciasPanel({
  viagemId,
  ocorrencias,
  onVerNoMapa,
}: {
  viagemId: string;
  ocorrencias: ViagemOcorrencia[];
  onVerNoMapa?: (oc: ViagemOcorrencia) => void;
}) {
  const tenantId = useActiveTenantId();
  const saveOcorrencia = useSaveViagemOcorrencia();
  const saveEvento = useSaveViagemEvento();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: "outro" as TipoViagemOcorrencia,
    gravidade: "media" as GravidadeOcorrencia,
    titulo: "",
    descricao: "",
  });

  const list = useListControls({
    items: ocorrencias,
    searchFn: (oc, q) =>
      matchesAny(
        [oc.titulo, oc.descricao, oc.tipo, oc.gravidade, oc.status, TIPOS_VIAGEM_OCORRENCIA.find((t) => t.value === oc.tipo)?.label],
        q,
      ),
    filterFn: (oc, f) => {
      if (f.gravidade && f.gravidade !== FILTER_ALL && oc.gravidade !== f.gravidade) return false;
      if (f.status && f.status !== FILTER_ALL && oc.status !== f.status) return false;
      return true;
    },
    initialFilters: { gravidade: FILTER_ALL, status: FILTER_ALL },
  });

  const registrar = () => {
    if (!form.titulo.trim() || !form.descricao.trim()) return toast.error("Preencha título e descrição");
    const now = new Date().toISOString();
    saveOcorrencia.mutate({
      id: generateUuid(),
      transportadora_id: tenantId,
      viagem_id: viagemId,
      tipo: form.tipo,
      gravidade: form.gravidade,
      status: "aberta",
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      created_at: now,
      updated_at: now,
    });
    saveEvento.mutate({
      id: generateUuid(),
      transportadora_id: tenantId,
      viagem_id: viagemId,
      tipo: "ocorrencia_registrada",
      titulo: `Ocorrência: ${form.titulo.trim()}`,
      descricao: form.descricao.trim(),
      origem: "operador",
      created_at: now,
    });
    toast.success("Ocorrência registrada");
    setForm({ tipo: "outro", gravidade: "media", titulo: "", descricao: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Registrar ocorrência
        </Button>
      </div>
      {ocorrencias.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma ocorrência registrada.</p>
      ) : (
        <div className="space-y-4">
          <ListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Buscar ocorrência…"
            totalItems={list.totalItems}
            page={list.page}
            pageSize={list.pageSize}
          >
            <ListFilterSelect label="Gravidade" value={list.filters.gravidade ?? FILTER_ALL} onChange={(v) => list.setFilter("gravidade", v)} options={GRAVIDADE_OCORRENCIA.map((g) => ({ value: g.value, label: g.label }))} />
            <ListFilterSelect label="Status" value={list.filters.status ?? FILTER_ALL} onChange={(v) => list.setFilter("status", v)} options={STATUS_OCORRENCIA.map((s) => ({ value: s.value, label: s.label }))} />
          </ListToolbar>
          <div className="space-y-3">
          {list.paginated.map((oc) => {
            const temLocal = oc.latitude != null && oc.longitude != null;
            return (
            <div
              key={oc.id}
              className={cn(
                "rounded-lg border p-4 space-y-2",
                temLocal && onVerNoMapa && "cursor-pointer hover:bg-muted/40 transition-colors",
              )}
              onClick={() => temLocal && onVerNoMapa?.(oc)}
              onKeyDown={(e) => {
                if (temLocal && onVerNoMapa && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onVerNoMapa(oc);
                }
              }}
              role={temLocal && onVerNoMapa ? "button" : undefined}
              tabIndex={temLocal && onVerNoMapa ? 0 : undefined}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="font-medium text-sm">{oc.titulo}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{TIPOS_VIAGEM_OCORRENCIA.find((t) => t.value === oc.tipo)?.label}</Badge>
                  <Badge variant={GRAVIDADE_VARIANT[oc.gravidade]}>{GRAVIDADE_OCORRENCIA.find((g) => g.value === oc.gravidade)?.label}</Badge>
                  <Badge variant="secondary">{STATUS_OCORRENCIA.find((s) => s.value === oc.status)?.label}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{oc.descricao}</p>
              {temLocal && (
                <p className="text-xs text-primary flex items-center gap-1 font-medium">
                  <MapPin className="h-3 w-3" />
                  {oc.latitude!.toFixed(5)}, {oc.longitude!.toFixed(5)}
                  {onVerNoMapa && " · Ver no mapa"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {format(new Date(oc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
            );
          })}
          </div>
          <ListPagination page={list.page} totalPages={list.totalPages} totalItems={list.totalItems} onPageChange={list.setPage} />
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar ocorrência</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoViagemOcorrencia })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_VIAGEM_OCORRENCIA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gravidade</Label>
              <Select value={form.gravidade} onValueChange={(v) => setForm({ ...form, gravidade: v as GravidadeOcorrencia })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRAVIDADE_OCORRENCIA.map((g) => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={registrar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
