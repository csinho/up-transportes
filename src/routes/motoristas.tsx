import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useMotoristas,
  useSaveMotorista,
  useRemoveMotorista,
  useActiveTenantId,
} from "@/data/store";
import type { Motorista, StatusMotorista } from "@/types";
import { generateUuid } from "@/lib/uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { DocumentUploader } from "@/components/DocumentUploader";
import { maskCPF, maskPhone } from "@/lib/masks";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";
import { STATUS_MOTORISTA_EDITAVEL } from "@/lib/veiculo-utils";

export const Route = createFileRoute("/motoristas")({
  head: () => ({ meta: [{ title: "Motoristas — ERP Transportadora" }] }),
  component: Page,
});

const STATUS: { value: StatusMotorista; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "disponivel", label: "Disponível" },
  { value: "em_viagem", label: "Em viagem" },
  { value: "inativo", label: "Inativo" },
  { value: "bloqueado", label: "Bloqueado" },
];

function empty(tenantId: string): Motorista {
  const now = new Date().toISOString();
  return {
    id: generateUuid(),
    transportadora_id: tenantId,
    nome: "",
    cpf: "",
    endereco: { cep: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", pais: "Brasil" },
    cnh: { numero: "", categoria: "" },
    status: "ativo",
    documentos: [],
    created_at: now,
    updated_at: now,
  };
}

function Page() {
  const tenantId = useActiveTenantId();
  const { data: motoristas = [] } = useMotoristas();
  const save = useSaveMotorista();
  const remove = useRemoveMotorista();
  const { confirm, ConfirmDialogHost } = useConfirm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Motorista | null>(null);

  const list = useListControls({
    items: motoristas,
    searchFn: (m, q) =>
      matchesAny([m.nome, m.cpf, m.cnh.numero, m.cnh.categoria, m.email, m.telefone_principal, m.status], q),
    filterFn: (m, filters) =>
      !filters.status || filters.status === FILTER_ALL || m.status === filters.status,
    initialFilters: { status: FILTER_ALL },
  });

  const novo = () => {
    setForm(empty(tenantId));
    setOpen(true);
  };
  const editar = (m: Motorista) => {
    setForm(m);
    setOpen(true);
  };
  const salvar = () => {
    if (!form) return;
    if (!form.nome || !form.cpf) return toast.error("Nome e CPF são obrigatórios");
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Motorista salvo");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <ConfirmDialogHost />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Motoristas</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro de apoio para viagens · {motoristas.length} cadastrados
          </p>
        </div>
        <Button onClick={novo}><Plus className="h-4 w-4 mr-2" /> Novo motorista</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <ListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Buscar motorista, CPF, CNH…"
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
          </ListToolbar>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>CNH</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.totalItems === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                {list.hasActiveFilters ? "Nenhum motorista encontrado." : "Nenhum motorista cadastrado."}
              </TableCell></TableRow>
            )}
            {list.paginated.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell>{m.cpf}</TableCell>
                <TableCell>{m.cnh.numero} ({m.cnh.categoria})</TableCell>
                <TableCell><Badge variant="secondary">{m.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => editar(m)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => confirm({
                      title: "Remover motorista?",
                      description: `Deseja excluir ${m.nome}? Esta ação não pode ser desfeita.`,
                      confirmLabel: "Remover",
                      destructive: true,
                      onConfirm: () => { remove.mutate(m.id); toast.success("Motorista removido"); },
                    })}><Trash2 className="h-3 w-3 text-destructive" /></Button>
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
          <DialogHeader>
            <DialogTitle>{form?.nome ? `Editar: ${form.nome}` : "Novo motorista"}</DialogTitle>
          </DialogHeader>
          {form && (
            <Tabs defaultValue="dados">
              <TabsList>
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="cnh">CNH</TabsTrigger>
                <TabsTrigger value="docs">Documentos</TabsTrigger>
              </TabsList>
              <TabsContent value="dados" className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2"><Label>Nome completo</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                  <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} /></div>
                  <div><Label>RG</Label><Input value={form.rg ?? ""} onChange={(e) => setForm({ ...form, rg: e.target.value })} /></div>
                  <div><Label>Nascimento</Label><Input type="date" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></div>
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
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusMotorista })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_MOTORISTA_EDITAVEL.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div><Label>Telefone</Label><Input value={form.telefone_principal ?? ""} onChange={(e) => setForm({ ...form, telefone_principal: maskPhone(e.target.value) })} /></div>
                  <div><Label>WhatsApp</Label><Input value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} /></div>
                  <div><Label>E-mail</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
              </TabsContent>
              <TabsContent value="endereco">
                <AddressForm value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e })} />
              </TabsContent>
              <TabsContent value="cnh">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><Label>Número</Label><Input value={form.cnh.numero} onChange={(e) => setForm({ ...form, cnh: { ...form.cnh, numero: e.target.value } })} /></div>
                  <div><Label>Categoria</Label><Input value={form.cnh.categoria} onChange={(e) => setForm({ ...form, cnh: { ...form.cnh, categoria: e.target.value.toUpperCase() } })} placeholder="A, B, C, D, E..." /></div>
                  <div><Label>Validade</Label><Input type="date" value={form.cnh.data_validade ?? ""} onChange={(e) => setForm({ ...form, cnh: { ...form.cnh, data_validade: e.target.value } })} /></div>
                  <div><Label>Emissão</Label><Input type="date" value={form.cnh.data_emissao ?? ""} onChange={(e) => setForm({ ...form, cnh: { ...form.cnh, data_emissao: e.target.value } })} /></div>
                  <div><Label>UF</Label><Input maxLength={2} value={form.cnh.uf ?? ""} onChange={(e) => setForm({ ...form, cnh: { ...form.cnh, uf: e.target.value.toUpperCase() } })} /></div>
                  <div><Label>Órgão emissor</Label><Input value={form.cnh.orgao_emissor ?? ""} onChange={(e) => setForm({ ...form, cnh: { ...form.cnh, orgao_emissor: e.target.value } })} /></div>
                </div>
              </TabsContent>
              <TabsContent value="docs">
                <DocumentUploader
                  documentos={form.documentos}
                  onChange={(docs) => setForm({ ...form, documentos: docs })}
                  uploadContext={{
                    transportadoraId: tenantId,
                    entidade: "motoristas",
                    entidadeId: form.id,
                  }}
                  tiposSugeridos={["CNH", "RG", "CPF", "Comprovante de endereço", "Certificado"]}
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
