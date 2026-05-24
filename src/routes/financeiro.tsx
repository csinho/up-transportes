import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useLancamentos,
  useSaveLancamento,
  useRemoveLancamento,
  useActiveTenantId,
  useViagens,
  useVeiculos,
  useFornecedores,
} from "@/data/store";
import type { LancamentoFinanceiro, TipoLancamento, CategoriaFinanceira, StatusLancamento } from "@/types";
import { CATEGORIAS_FINANCEIRAS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatPlaca } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — ERP Transportadora" }] }),
  component: Page,
});

const STATUS: { value: StatusLancamento; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
];

function empty(tenantId: string): LancamentoFinanceiro {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    transportadora_id: tenantId,
    tipo: "despesa",
    categoria: "outros",
    descricao: "",
    valor: 0,
    data_lancamento: now.slice(0, 10),
    status: "pendente",
    created_at: now,
    updated_at: now,
  };
}

function Page() {
  const tenantId = useActiveTenantId();
  const { data: lancamentos = [] } = useLancamentos();
  const { data: viagens = [] } = useViagens();
  const { data: veiculos = [] } = useVeiculos();
  const { data: fornecedores = [] } = useFornecedores();
  const save = useSaveLancamento();
  const remove = useRemoveLancamento();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LancamentoFinanceiro | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const resumo = useMemo(() => {
    const pagos = lancamentos.filter((l) => l.status === "pago");
    const receitas = pagos.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
    const despesas = pagos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);
    const pendentes = lancamentos.filter((l) => l.status === "pendente").reduce((s, l) => s + l.valor, 0);
    return { receitas, despesas, saldo: receitas - despesas, pendentes };
  }, [lancamentos]);

  const filtrados = lancamentos.filter((l) => {
    if (filtroTipo !== "todos" && l.tipo !== filtroTipo) return false;
    if (filtroStatus !== "todos" && l.status !== filtroStatus) return false;
    return true;
  });

  const salvar = () => {
    if (!form) return;
    if (!form.descricao || form.valor <= 0) return toast.error("Descrição e valor são obrigatórios");
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Lançamento salvo");
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Lançamentos operacionais da transportadora</p>
        </div>
        <Button onClick={() => { setForm(empty(tenantId)); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo lançamento
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> Receitas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">{formatCurrency(resumo.receitas)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-600" /> Despesas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(resumo.despesas)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" /> Saldo</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(resumo.saldo)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /> Pendentes</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{formatCurrency(resumo.pendentes)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Label>Tipo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Label>Status</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados
              .slice()
              .sort((a, b) => b.data_lancamento.localeCompare(a.data_lancamento))
              .map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.data_lancamento}</TableCell>
                  <TableCell className="font-medium">{l.descricao}</TableCell>
                  <TableCell>{CATEGORIAS_FINANCEIRAS.find((c) => c.value === l.categoria)?.label ?? l.categoria}</TableCell>
                  <TableCell>
                    <Badge variant={l.tipo === "receita" ? "default" : "secondary"}>{l.tipo}</Badge>
                  </TableCell>
                  <TableCell className={l.tipo === "receita" ? "text-emerald-600" : "text-red-600"}>
                    {formatCurrency(l.valor)}
                  </TableCell>
                  <TableCell>{l.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setForm(l); setOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover lançamento?")) remove.mutate(l.id); }}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form?.descricao || "Novo lançamento"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoLancamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as CategoriaFinanceira })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_FINANCEIRAS.filter((c) => c.tipo === form.tipo).map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.valor || ""} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusLancamento })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data lançamento</Label>
                <Input type="date" value={form.data_lancamento.slice(0, 10)} onChange={(e) => setForm({ ...form, data_lancamento: e.target.value })} />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={form.data_vencimento?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value || undefined })} />
              </div>
              <div>
                <Label>Pagamento</Label>
                <Input type="date" value={form.data_pagamento?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value || undefined })} />
              </div>
              <div>
                <Label>Forma pagamento</Label>
                <Input value={form.forma_pagamento ?? ""} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} />
              </div>
              <div>
                <Label>Viagem</Label>
                <Select value={form.viagem_id ?? ""} onValueChange={(v) => setForm({ ...form, viagem_id: v || undefined })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {viagens.map((v) => (
                      <SelectItem key={v.id} value={v.id}>Viagem #{v.numero_viagem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Veículo</Label>
                <Select value={form.veiculo_id ?? ""} onValueChange={(v) => setForm({ ...form, veiculo_id: v || undefined })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{formatPlaca(v.placa)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Select value={form.fornecedor_id ?? ""} onValueChange={(v) => setForm({ ...form, fornecedor_id: v || undefined })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
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
