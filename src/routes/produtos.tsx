import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProdutos, useSaveProduto, useRemoveProduto, useActiveTenantId } from "@/data/store";
import type { ProdutoCarga, UnidadeMedida } from "@/types";
import { CATEGORIAS_PRODUTO, UNIDADES_MEDIDA } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos / Cargas — ERP Transportadora" }] }),
  component: Page,
});

function empty(tenantId: string): ProdutoCarga {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), transportadora_id: tenantId,
    nome: "", categoria: "Carga seca", unidade_medida: "kg", produto_perigoso: false, status: "ativo",
    created_at: now, updated_at: now,
  };
}

function Page() {
  const tenantId = useActiveTenantId();
  const { data: produtos = [] } = useProdutos();
  const save = useSaveProduto();
  const remove = useRemoveProduto();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProdutoCarga | null>(null);

  const salvar = () => {
    if (!form) return;
    if (!form.nome) return toast.error("Nome é obrigatório");
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Produto salvo");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Produtos / Cargas</h1>
          <p className="text-sm text-muted-foreground">{produtos.length} cadastrados</p>
        </div>
        <Button onClick={() => { setForm(empty(tenantId)); setOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Novo produto</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Unidade</TableHead>
            <TableHead>Perigoso</TableHead><TableHead>Status</TableHead><TableHead className="w-[120px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {produtos.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum produto cadastrado.</TableCell></TableRow>}
            {produtos.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell>{p.categoria}</TableCell>
                <TableCell>{p.unidade_medida}</TableCell>
                <TableCell>{p.produto_perigoso ? "Sim" : "Não"}</TableCell>
                <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setForm(p); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover?")) remove.mutate(p.id); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{form?.nome || "Novo produto"}</DialogTitle></DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS_PRODUTO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={form.unidade_medida} onValueChange={(v) => setForm({ ...form, unidade_medida: v as UnidadeMedida })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES_MEDIDA.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>NCM</Label><Input value={form.ncm ?? ""} onChange={(e) => setForm({ ...form, ncm: e.target.value })} /></div>
              <div className="flex items-end gap-2"><Switch checked={form.produto_perigoso} onCheckedChange={(v) => setForm({ ...form, produto_perigoso: v })} /><Label>Produto perigoso</Label></div>
              {form.produto_perigoso && (<>
                <div><Label>Código ONU</Label><Input value={form.codigo_onu ?? ""} onChange={(e) => setForm({ ...form, codigo_onu: e.target.value })} /></div>
                <div><Label>Classe de risco</Label><Input value={form.classe_risco ?? ""} onChange={(e) => setForm({ ...form, classe_risco: e.target.value })} /></div>
              </>)}
              <div className="col-span-2"><Label>Descrição</Label><Textarea value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
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
