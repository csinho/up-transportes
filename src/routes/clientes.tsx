import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useClientes, useSaveCliente, useRemoveCliente, useActiveTenantId } from "@/data/store";
import type { Cliente, TipoCliente } from "@/types";
import { generateUuid } from "@/lib/uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { maskCNPJ, maskCPF, maskPhone } from "@/lib/masks";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — ERP Transportadora" }] }),
  component: Page,
});

function empty(tenantId: string): Cliente {
  const now = new Date().toISOString();
  return {
    id: generateUuid(), transportadora_id: tenantId, tipo_cliente: "PJ", nome: "",
    endereco: { cep: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", pais: "Brasil" },
    created_at: now, updated_at: now,
  };
}

function Page() {
  const tenantId = useActiveTenantId();
  const { data: clientes = [] } = useClientes();
  const save = useSaveCliente();
  const remove = useRemoveCliente();
  const { confirm, ConfirmDialogHost } = useConfirm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Cliente | null>(null);

  const list = useListControls({
    items: clientes,
    searchFn: (c, q) => matchesAny([c.nome, c.tipo_cliente, c.cpf, c.cnpj, c.endereco.cidade, c.endereco.uf, c.telefone_principal], q),
    filterFn: (c, f) => !f.tipo || f.tipo === FILTER_ALL || c.tipo_cliente === f.tipo,
    initialFilters: { tipo: FILTER_ALL },
  });

  const salvar = () => {
    if (!form) return;
    if (!form.nome) return toast.error("Nome é obrigatório");
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Cliente salvo");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <ConfirmDialogHost />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Origem e destino das viagens · {clientes.length} cadastrados
          </p>
        </div>
        <Button onClick={() => { setForm(empty(tenantId)); setOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Novo cliente</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <ListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Buscar cliente, CPF/CNPJ, cidade…"
            totalItems={list.totalItems}
            page={list.page}
            pageSize={list.pageSize}
          >
            <ListFilterSelect
              label="Tipo"
              value={list.filters.tipo ?? FILTER_ALL}
              onChange={(v) => list.setFilter("tipo", v)}
              options={[{ value: "PJ", label: "PJ" }, { value: "PF", label: "PF" }]}
            />
          </ListToolbar>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>CPF/CNPJ</TableHead>
            <TableHead>Cidade/UF</TableHead><TableHead>Telefone</TableHead><TableHead className="w-[120px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.totalItems === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {list.hasActiveFilters ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}
              </TableCell></TableRow>
            )}
            {list.paginated.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.tipo_cliente}</TableCell>
                <TableCell>{c.cnpj || c.cpf}</TableCell>
                <TableCell>{c.endereco.cidade}/{c.endereco.uf}</TableCell>
                <TableCell>{c.telefone_principal}</TableCell>
                <TableCell><div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setForm(c); setOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm({
                    title: "Remover cliente?",
                    description: `Deseja excluir ${c.nome}? Esta ação não pode ser desfeita.`,
                    confirmLabel: "Remover",
                    destructive: true,
                    onConfirm: () => { remove.mutate(c.id); toast.success("Cliente removido"); },
                  })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-4 pb-4">
          <ListPagination page={list.page} totalPages={list.totalPages} totalItems={list.totalItems} onPageChange={list.setPage} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.nome || "Novo cliente"}</DialogTitle></DialogHeader>
          {form && (
            <Tabs defaultValue="dados">
              <TabsList>
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
              </TabsList>
              <TabsContent value="dados" className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo_cliente} onValueChange={(v) => setForm({ ...form, tipo_cliente: v as TipoCliente })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="PF">Pessoa Física</SelectItem><SelectItem value="PJ">Pessoa Jurídica</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label>Nome fantasia</Label><Input value={form.nome_fantasia ?? ""} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Razão social</Label><Input value={form.razao_social ?? ""} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
                {form.tipo_cliente === "PJ" ? (
                  <div><Label>CNPJ</Label><Input value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })} /></div>
                ) : (
                  <div><Label>CPF</Label><Input value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} /></div>
                )}
                <div><Label>Inscrição estadual</Label><Input value={form.inscricao_estadual ?? ""} onChange={(e) => setForm({ ...form, inscricao_estadual: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.telefone_principal ?? ""} onChange={(e) => setForm({ ...form, telefone_principal: maskPhone(e.target.value) })} /></div>
                <div><Label>WhatsApp</Label><Input value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} /></div>
                <div><Label>E-mail</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Contato</Label><Input value={form.contato_responsavel ?? ""} onChange={(e) => setForm({ ...form, contato_responsavel: e.target.value })} /></div>
                <div><Label>Cargo</Label><Input value={form.cargo_contato ?? ""} onChange={(e) => setForm({ ...form, cargo_contato: e.target.value })} /></div>
              </TabsContent>
              <TabsContent value="endereco">
                <AddressForm value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e })} />
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
