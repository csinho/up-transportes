import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useFornecedores, useSaveFornecedor, useRemoveFornecedor, useActiveTenantId } from "@/data/store";
import type { Fornecedor, TipoFornecedor } from "@/types";
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

export const Route = createFileRoute("/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores — ERP Transportadora" }] }),
  component: Page,
});

function empty(tenantId: string): Fornecedor {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    transportadora_id: tenantId,
    tipo: "PJ",
    nome: "",
    endereco: { cep: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", pais: "Brasil" },
    created_at: now,
    updated_at: now,
  };
}

function Page() {
  const tenantId = useActiveTenantId();
  const { data: fornecedores = [] } = useFornecedores();
  const save = useSaveFornecedor();
  const remove = useRemoveFornecedor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Fornecedor | null>(null);

  const salvar = () => {
    if (!form) return;
    if (!form.nome) return toast.error("Nome é obrigatório");
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Fornecedor salvo");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">{fornecedores.length} cadastrados</p>
        </div>
        <Button onClick={() => { setForm(empty(tenantId)); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo fornecedor
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Cidade/UF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedores.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum fornecedor cadastrado.
                </TableCell>
              </TableRow>
            )}
            {fornecedores.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nome}</TableCell>
                <TableCell>{f.tipo}</TableCell>
                <TableCell>{f.cnpj || f.cpf || "—"}</TableCell>
                <TableCell>{f.endereco.cidade}/{f.endereco.uf}</TableCell>
                <TableCell>{f.telefone_principal || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setForm(f); setOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover fornecedor?")) remove.mutate(f.id); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.nome || "Novo fornecedor"}</DialogTitle>
          </DialogHeader>
          {form && (
            <Tabs defaultValue="dados">
              <TabsList>
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
              </TabsList>
              <TabsContent value="dados" className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoFornecedor })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Nome / Fantasia</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                {form.tipo === "PJ" ? (
                  <>
                    <div className="md:col-span-2">
                      <Label>Razão social</Label>
                      <Input value={form.razao_social ?? ""} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })} />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label>CPF</Label>
                    <Input value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })} />
                  </div>
                )}
                <div>
                  <Label>Telefone</Label>
                  <Input value={form.telefone_principal ?? ""} onChange={(e) => setForm({ ...form, telefone_principal: maskPhone(e.target.value) })} />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Contato responsável</Label>
                  <Input value={form.contato_responsavel ?? ""} onChange={(e) => setForm({ ...form, contato_responsavel: e.target.value })} />
                </div>
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
