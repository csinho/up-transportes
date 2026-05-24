import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  usePneus,
  useSavePneu,
  useRemovePneu,
  useActiveTenantId,
  useVeiculos,
  useFornecedores,
  useInstalarPneu,
  useDesinstalarPneu,
} from "@/data/store";
import type { Pneu, StatusPneu, PosicaoPneu } from "@/types";
import { MEDIDAS_PNEU, POSICOES_PNEU } from "@/types";
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
import { TireLayout } from "@/components/TireLayout";
import { formatPlaca } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/pneus")({
  head: () => ({ meta: [{ title: "Pneus — ERP Transportadora" }] }),
  component: Page,
});

const STATUS: { value: StatusPneu; label: string }[] = [
  { value: "estoque", label: "Estoque" },
  { value: "instalado", label: "Instalado" },
  { value: "recapagem", label: "Recapagem" },
  { value: "descartado", label: "Descartado" },
];

function empty(tenantId: string): Pneu {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    transportadora_id: tenantId,
    codigo_fogo: "",
    marca: "",
    medida: "295/80R22.5",
    status: "estoque",
    created_at: now,
    updated_at: now,
  };
}

function Page() {
  const tenantId = useActiveTenantId();
  const { data: pneus = [] } = usePneus();
  const { data: veiculos = [] } = useVeiculos();
  const { data: fornecedores = [] } = useFornecedores();
  const save = useSavePneu();
  const remove = useRemovePneu();
  const instalar = useInstalarPneu();
  const desinstalar = useDesinstalarPneu();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Pneu | null>(null);
  const [veiculoId, setVeiculoId] = useState<string>("");

  const veiculo = veiculos.find((v) => v.id === veiculoId);
  const pneusEstoque = pneus.filter((p) => p.status === "estoque");
  const pneusInstalados = veiculoId
    ? pneus.filter((p) => p.veiculo_id === veiculoId && p.status === "instalado")
    : [];

  const salvar = () => {
    if (!form) return;
    if (!form.codigo_fogo || !form.marca) return toast.error("Código fogo e marca são obrigatórios");
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Pneu salvo");
    setOpen(false);
  };

  const handleInstalar = (pneuId: string, posicao: PosicaoPneu) => {
    if (!veiculoId) return toast.error("Selecione um veículo");
    instalar.mutate({ pneuId, veiculoId, posicao, hodometro: veiculo?.hodometro_atual });
    toast.success("Pneu instalado");
  };

  const handleDesinstalar = (pneuId: string) => {
    desinstalar.mutate(pneuId);
    toast.success("Pneu devolvido ao estoque");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pneus</h1>
          <p className="text-sm text-muted-foreground">
            {pneus.length} cadastrados · {pneusEstoque.length} em estoque
          </p>
        </div>
        <Button onClick={() => { setForm(empty(tenantId)); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo pneu
        </Button>
      </div>

      <Tabs defaultValue="estoque">
        <TabsList>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="instalacao">Instalação visual</TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cód. fogo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Medida</TableHead>
                  <TableHead>Sulco</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pneus.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum pneu cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {pneus.map((p) => {
                  const v = veiculos.find((ve) => ve.id === p.veiculo_id);
                  const pos = POSICOES_PNEU.find((x) => x.value === p.posicao)?.label;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.codigo_fogo}</TableCell>
                      <TableCell>{p.marca}</TableCell>
                      <TableCell>{p.medida}</TableCell>
                      <TableCell>{p.sulco_atual_mm != null ? `${p.sulco_atual_mm} mm` : "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                      <TableCell>{v ? `${formatPlaca(v.placa)}${pos ? ` (${pos})` : ""}` : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setForm(p); setOpen(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover pneu?")) remove.mutate(p.id); }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="instalacao" className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-sm">
              <Label>Veículo</Label>
              <Select value={veiculoId} onValueChange={setVeiculoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                <SelectContent>
                  {veiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {formatPlaca(v.placa)} — {v.tipo_veiculo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {veiculo ? (
            <TireLayout
              veiculo={veiculo}
              pneusInstalados={pneusInstalados}
              pneusEstoque={pneusEstoque}
              onInstalar={handleInstalar}
              onDesinstalar={handleDesinstalar}
            />
          ) : (
            <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
              Selecione um veículo para montar o layout de pneus.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.codigo_fogo ? `Pneu ${form.codigo_fogo}` : "Novo pneu"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label>Código fogo</Label>
                <Input value={form.codigo_fogo} onChange={(e) => setForm({ ...form, codigo_fogo: e.target.value })} />
              </div>
              <div>
                <Label>Marca</Label>
                <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input value={form.modelo ?? ""} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
              </div>
              <div>
                <Label>Medida</Label>
                <Select value={form.medida} onValueChange={(v) => setForm({ ...form, medida: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEDIDAS_PNEU.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusPneu })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Select
                  value={form.fornecedor_id ?? ""}
                  onValueChange={(v) => setForm({ ...form, fornecedor_id: v || undefined })}
                >
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>DOT</Label>
                <Input value={form.dot ?? ""} onChange={(e) => setForm({ ...form, dot: e.target.value })} />
              </div>
              <div>
                <Label>Nº série</Label>
                <Input value={form.numero_serie ?? ""} onChange={(e) => setForm({ ...form, numero_serie: e.target.value })} />
              </div>
              <div>
                <Label>Valor compra</Label>
                <Input type="number" value={form.valor_compra ?? ""} onChange={(e) => setForm({ ...form, valor_compra: Number(e.target.value) || undefined })} />
              </div>
              <div>
                <Label>Sulco inicial (mm)</Label>
                <Input type="number" value={form.sulco_inicial_mm ?? ""} onChange={(e) => setForm({ ...form, sulco_inicial_mm: Number(e.target.value) || undefined })} />
              </div>
              <div>
                <Label>Sulco atual (mm)</Label>
                <Input type="number" value={form.sulco_atual_mm ?? ""} onChange={(e) => setForm({ ...form, sulco_atual_mm: Number(e.target.value) || undefined })} />
              </div>
              <div className="md:col-span-3">
                <Label>Observações</Label>
                <Input value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>
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
