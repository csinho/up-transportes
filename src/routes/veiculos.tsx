import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useVeiculos,
  useSaveVeiculo,
  useRemoveVeiculo,
  useActiveTenantId,
} from "@/data/store";
import type { Veiculo, StatusVeiculo, PapelVeiculo } from "@/types";
import { TIPOS_VEICULO } from "@/types";
import { generateUuid } from "@/lib/uuid";
import {
  PAPEIS_VEICULO,
  getPapelVeiculo,
  inferirPapelVeiculo,
  tiposVeiculoPorPapel,
} from "@/lib/veiculo-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DocumentUploader } from "@/components/DocumentUploader";
import { formatPlaca, maskPlaca } from "@/lib/masks";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";
import { VeiculoFipeSelects } from "@/components/veiculo/VeiculoFipeSelects";
import { STATUS_VEICULO_EDITAVEL } from "@/lib/veiculo-utils";

export const Route = createFileRoute("/veiculos")({
  head: () => ({ meta: [{ title: "Veículos — ERP Transportadora" }] }),
  component: Page,
});

const STATUS: { value: StatusVeiculo; label: string }[] = [
  { value: "disponivel", label: "Disponível" },
  { value: "em_viagem", label: "Em viagem" },
  { value: "em_manutencao", label: "Em manutenção" },
  { value: "inativo", label: "Inativo" },
  { value: "bloqueado", label: "Bloqueado" },
];

function uniqSorted(values: (string | number | undefined)[]) {
  return [...new Set(values.filter(Boolean).map(String))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true }),
  );
}

function empty(tenantId: string): Veiculo {
  const now = new Date().toISOString();
  return {
    id: generateUuid(),
    transportadora_id: tenantId,
    papel_veiculo: "tracao",
    tipo_veiculo: "Cavalo mecânico",
    placa: "",
    renavam: "",
    chassi: "",
    numero_eixos: 2,
    status: "disponivel",
    documentos: [],
    created_at: now,
    updated_at: now,
  };
}

function Page() {
  const tenantId = useActiveTenantId();
  const { data: veiculos = [] } = useVeiculos();
  const save = useSaveVeiculo();
  const remove = useRemoveVeiculo();
  const { confirm, ConfirmDialogHost } = useConfirm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Veiculo | null>(null);

  const list = useListControls({
    items: veiculos,
    searchFn: (v, q) =>
      matchesAny(
        [v.placa, v.tipo_veiculo, v.marca, v.modelo, v.renavam, v.status, v.ano_fabricacao, v.ano_modelo],
        q,
      ),
    filterFn: (v, f) => {
      if (f.status && f.status !== FILTER_ALL && v.status !== f.status) return false;
      if (f.papel && f.papel !== FILTER_ALL && getPapelVeiculo(v) !== f.papel) return false;
      if (f.tipo && f.tipo !== FILTER_ALL && v.tipo_veiculo !== f.tipo) return false;
      if (f.marca && f.marca !== FILTER_ALL && v.marca !== f.marca) return false;
      if (f.modelo && f.modelo !== FILTER_ALL && v.modelo !== f.modelo) return false;
      if (f.ano && f.ano !== FILTER_ALL) {
        const ano = Number(f.ano);
        if (v.ano_modelo !== ano && v.ano_fabricacao !== ano) return false;
      }
      return true;
    },
    initialFilters: { status: FILTER_ALL, papel: FILTER_ALL, tipo: FILTER_ALL, marca: FILTER_ALL, modelo: FILTER_ALL, ano: FILTER_ALL },
  });

  const tiposPorPapelForm = useMemo(
    () => (form?.papel_veiculo ? tiposVeiculoPorPapel(form.papel_veiculo) : [...TIPOS_VEICULO]),
    [form?.papel_veiculo],
  );

  const marcasFiltro = useMemo(() => uniqSorted(veiculos.map((v) => v.marca)), [veiculos]);
  const modelosFiltro = useMemo(() => {
    const base =
      list.filters.marca && list.filters.marca !== FILTER_ALL
        ? veiculos.filter((v) => v.marca === list.filters.marca)
        : veiculos;
    return uniqSorted(base.map((v) => v.modelo));
  }, [veiculos, list.filters.marca]);
  const anosFiltro = useMemo(
    () =>
      uniqSorted(veiculos.flatMap((v) => [v.ano_modelo, v.ano_fabricacao]))
        .map(Number)
        .sort((a, b) => b - a)
        .map(String),
    [veiculos],
  );

  const salvar = () => {
    if (!form) return;
    if (!form.placa || !form.renavam || !form.chassi) return toast.error("Placa, RENAVAM e chassi são obrigatórios");
    if (!form.papel_veiculo) return toast.error("Informe se o veículo é tração ou implemento");
    if (!form.marca || !form.modelo || !form.ano_modelo) {
      return toast.error("Selecione marca, modelo e ano na tabela FIPE");
    }
    const papel = form.papel_veiculo ?? inferirPapelVeiculo(form.tipo_veiculo);
    save.mutate({ ...form, papel_veiculo: papel, updated_at: new Date().toISOString() });
    toast.success("Veículo salvo");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <ConfirmDialogHost />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de apoio para vincular às viagens · {veiculos.length} cadastrados
          </p>
        </div>
        <Button onClick={() => { setForm(empty(tenantId)); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo veículo
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <ListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Buscar placa, tipo, marca…"
            totalItems={list.totalItems}
            page={list.page}
            pageSize={list.pageSize}
          >
            <ListFilterSelect
              label="Status"
              value={list.filters.status ?? FILTER_ALL}
              onChange={(v) => list.setFilter("status", v)}
              options={STATUS.map((s) => ({ value: s.value, label: s.label }))}
            />
            <ListFilterSelect
              label="Papel"
              value={list.filters.papel ?? FILTER_ALL}
              onChange={(v) => list.setFilter("papel", v)}
              options={PAPEIS_VEICULO.map((p) => ({ value: p.value, label: p.label }))}
            />
            <ListFilterSelect
              label="Tipo"
              value={list.filters.tipo ?? FILTER_ALL}
              onChange={(v) => list.setFilter("tipo", v)}
              options={TIPOS_VEICULO.map((t) => ({ value: t, label: t }))}
            />
            <ListFilterSelect
              label="Marca"
              value={list.filters.marca ?? FILTER_ALL}
              onChange={(v) => {
                list.setFilter("marca", v);
                list.setFilter("modelo", FILTER_ALL);
              }}
              options={marcasFiltro.map((m) => ({ value: m, label: m }))}
            />
            <ListFilterSelect
              label="Modelo"
              value={list.filters.modelo ?? FILTER_ALL}
              onChange={(v) => list.setFilter("modelo", v)}
              options={modelosFiltro.map((m) => ({ value: m, label: m }))}
            />
            <ListFilterSelect
              label="Ano"
              value={list.filters.ano ?? FILTER_ALL}
              onChange={(v) => list.setFilter("ano", v)}
              options={anosFiltro.map((a) => ({ value: a, label: a }))}
            />
          </ListToolbar>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Placa</TableHead><TableHead>Papel</TableHead><TableHead>Tipo</TableHead><TableHead>Marca/Modelo</TableHead>
            <TableHead>RENAVAM</TableHead><TableHead>Status</TableHead><TableHead className="w-[100px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.totalItems === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {list.hasActiveFilters ? "Nenhum veículo encontrado." : "Nenhum veículo cadastrado."}
              </TableCell></TableRow>
            )}
            {list.paginated.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{formatPlaca(v.placa)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getPapelVeiculo(v) === "tracao" ? "Tração" : "Implemento"}</Badge>
                </TableCell>
                <TableCell>{v.tipo_veiculo}</TableCell>
                <TableCell>{[v.marca, v.modelo].filter(Boolean).join(" ")}</TableCell>
                <TableCell>{v.renavam}</TableCell>
                <TableCell><Badge variant="secondary">{v.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setForm(v); setOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => confirm({
                      title: "Remover veículo?",
                      description: `Deseja excluir o veículo ${formatPlaca(v.placa)}? Esta ação não pode ser desfeita.`,
                      confirmLabel: "Remover",
                      destructive: true,
                      onConfirm: () => { remove.mutate(v.id); toast.success("Veículo removido"); },
                    })}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-4 pb-4">
          <ListPagination
            page={list.page}
            totalPages={list.totalPages}
            totalItems={list.totalItems}
            onPageChange={list.setPage}
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.placa ? `Veículo ${formatPlaca(form.placa)}` : "Novo veículo"}</DialogTitle></DialogHeader>
          {form && (
            <Tabs defaultValue="dados">
              <TabsList>
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="tecnico">Técnico</TabsTrigger>
                <TabsTrigger value="docs">Documentos</TabsTrigger>
              </TabsList>
              <TabsContent value="dados" className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <div>
                    <Label className="text-base">Papel na operação *</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Defina se este cadastro é o veículo de tração (cabine) ou um implemento acoplado (reboque/carreta).
                    </p>
                    <Select
                      value={form.papel_veiculo ?? inferirPapelVeiculo(form.tipo_veiculo)}
                      onValueChange={(v) => {
                        const papel = v as PapelVeiculo;
                        const tipos = tiposVeiculoPorPapel(papel);
                        setForm({
                          ...form,
                          papel_veiculo: papel,
                          tipo_veiculo: tipos.includes(form.tipo_veiculo) ? form.tipo_veiculo : tipos[0],
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAPEIS_VEICULO.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {PAPEIS_VEICULO.find((p) => p.value === (form.papel_veiculo ?? inferirPapelVeiculo(form.tipo_veiculo)))?.descricao}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <VeiculoFipeSelects
                  values={{
                    marca: form.marca,
                    modelo: form.modelo,
                    ano_modelo: form.ano_modelo,
                    ano_fabricacao: form.ano_fabricacao,
                  }}
                  onChange={(patch) => setForm({ ...form, ...patch })}
                />
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo_veiculo} onValueChange={(v) => setForm({ ...form, tipo_veiculo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{tiposPorPapelForm.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Identificação interna</Label><Input value={form.identificacao_interna ?? ""} onChange={(e) => setForm({ ...form, identificacao_interna: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  {form.status === "em_viagem" ? (
                    <div className="space-y-1">
                      <Input value="Em viagem" readOnly disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">
                        Definido automaticamente pela viagem ativa. Finalize ou cancele a viagem para liberar.
                      </p>
                    </div>
                  ) : (
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusVeiculo })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_VEICULO_EDITAVEL.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div><Label>Placa</Label><Input value={form.placa} onChange={(e) => setForm({ ...form, placa: maskPlaca(e.target.value) })} placeholder="ABC1D23" /></div>
                <div><Label>RENAVAM</Label><Input value={form.renavam} onChange={(e) => setForm({ ...form, renavam: e.target.value })} /></div>
                <div><Label>Chassi</Label><Input value={form.chassi} onChange={(e) => setForm({ ...form, chassi: e.target.value.toUpperCase() })} /></div>
                <div><Label>Cor</Label><Input value={form.cor ?? ""} onChange={(e) => setForm({ ...form, cor: e.target.value })} /></div>
                <div><Label>RNTRC</Label><Input value={form.rntrc ?? ""} onChange={(e) => setForm({ ...form, rntrc: e.target.value })} /></div>
                </div>
              </TabsContent>
              <TabsContent value="tecnico" className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label>Tara (kg)</Label><Input type="number" value={form.tara ?? ""} onChange={(e) => setForm({ ...form, tara: Number(e.target.value) || undefined })} /></div>
                <div><Label>Capacidade (kg)</Label><Input type="number" value={form.capacidade_carga ?? ""} onChange={(e) => setForm({ ...form, capacidade_carga: Number(e.target.value) || undefined })} /></div>
                <div><Label>PBT (kg)</Label><Input type="number" value={form.peso_bruto_total ?? ""} onChange={(e) => setForm({ ...form, peso_bruto_total: Number(e.target.value) || undefined })} /></div>
                <div><Label>Eixos</Label><Input type="number" value={form.numero_eixos ?? ""} onChange={(e) => setForm({ ...form, numero_eixos: Number(e.target.value) || undefined })} /></div>
                <div><Label>Carroceria</Label><Input value={form.tipo_carroceria ?? ""} onChange={(e) => setForm({ ...form, tipo_carroceria: e.target.value })} /></div>
                <div><Label>Combustível</Label><Input value={form.tipo_combustivel ?? ""} onChange={(e) => setForm({ ...form, tipo_combustivel: e.target.value })} /></div>
                <div><Label>Hodômetro</Label><Input type="number" value={form.hodometro_atual ?? ""} onChange={(e) => setForm({ ...form, hodometro_atual: Number(e.target.value) || undefined })} /></div>
                <div><Label>Nº motor</Label><Input value={form.numero_motor ?? ""} onChange={(e) => setForm({ ...form, numero_motor: e.target.value })} /></div>
              </TabsContent>
              <TabsContent value="docs">
                <DocumentUploader
                  documentos={form.documentos}
                  onChange={(d) => setForm({ ...form, documentos: d })}
                  uploadContext={{
                    transportadoraId: tenantId,
                    entidade: "veiculos",
                    entidadeId: form.id,
                  }}
                  tiposSugeridos={["CRLV", "ANTT/RNTRC", "Apólice de seguro", "Licenciamento", "Laudo"]}
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
