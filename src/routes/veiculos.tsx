import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useVeiculos, useSaveVeiculo, useRemoveVeiculo, useActiveTenantId } from "@/data/store";
import type { Veiculo, StatusVeiculo } from "@/types";
import { TIPOS_VEICULO } from "@/types";
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

function empty(tenantId: string): Veiculo {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    transportadora_id: tenantId,
    tipo_veiculo: "Cavalo mecânico",
    placa: "",
    renavam: "",
    chassi: "",
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Veiculo | null>(null);

  const salvar = () => {
    if (!form) return;
    if (!form.placa || !form.renavam || !form.chassi) return toast.error("Placa, RENAVAM e chassi são obrigatórios");
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Veículo salvo");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-sm text-muted-foreground">{veiculos.length} cadastrados</p>
        </div>
        <Button onClick={() => { setForm(empty(tenantId)); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo veículo
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Placa</TableHead><TableHead>Tipo</TableHead><TableHead>Marca/Modelo</TableHead>
            <TableHead>RENAVAM</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {veiculos.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum veículo cadastrado.</TableCell></TableRow>
            )}
            {veiculos.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{formatPlaca(v.placa)}</TableCell>
                <TableCell>{v.tipo_veiculo}</TableCell>
                <TableCell>{[v.marca, v.modelo].filter(Boolean).join(" ")}</TableCell>
                <TableCell>{v.renavam}</TableCell>
                <TableCell><Badge variant="secondary">{v.status}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setForm(v); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover veículo?")) remove.mutate(v.id); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
              <TabsContent value="dados" className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo_veiculo} onValueChange={(v) => setForm({ ...form, tipo_veiculo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS_VEICULO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Identificação interna</Label><Input value={form.identificacao_interna ?? ""} onChange={(e) => setForm({ ...form, identificacao_interna: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusVeiculo })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Placa</Label><Input value={form.placa} onChange={(e) => setForm({ ...form, placa: maskPlaca(e.target.value) })} placeholder="ABC1D23" /></div>
                <div><Label>RENAVAM</Label><Input value={form.renavam} onChange={(e) => setForm({ ...form, renavam: e.target.value })} /></div>
                <div><Label>Chassi</Label><Input value={form.chassi} onChange={(e) => setForm({ ...form, chassi: e.target.value.toUpperCase() })} /></div>
                <div><Label>Marca</Label><Input value={form.marca ?? ""} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
                <div><Label>Modelo</Label><Input value={form.modelo ?? ""} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></div>
                <div><Label>Cor</Label><Input value={form.cor ?? ""} onChange={(e) => setForm({ ...form, cor: e.target.value })} /></div>
                <div><Label>Ano fabricação</Label><Input type="number" value={form.ano_fabricacao ?? ""} onChange={(e) => setForm({ ...form, ano_fabricacao: Number(e.target.value) || undefined })} /></div>
                <div><Label>Ano modelo</Label><Input type="number" value={form.ano_modelo ?? ""} onChange={(e) => setForm({ ...form, ano_modelo: Number(e.target.value) || undefined })} /></div>
                <div><Label>RNTRC</Label><Input value={form.rntrc ?? ""} onChange={(e) => setForm({ ...form, rntrc: e.target.value })} /></div>
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
                <DocumentUploader documentos={form.documentos} onChange={(d) => setForm({ ...form, documentos: d })}
                  tiposSugeridos={["CRLV", "ANTT/RNTRC", "Apólice de seguro", "Licenciamento", "Laudo"]} />
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
