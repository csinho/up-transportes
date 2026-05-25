import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useViagens,
  useSaveViagem,
  useRemoveViagem,
  useActiveTenantId,
  useMotoristas,
  useVeiculos,
  useClientes,
  useProdutos,
  nextViagemNumero,
} from "@/data/store";
import type { Viagem, StatusViagem, Endereco } from "@/types";
import { STATUS_VIAGEM, UNIDADES_MEDIDA } from "@/types";
import { generateUuid } from "@/lib/uuid";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { Plus, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useListControls } from "@/hooks/use-list-controls";
import { ListToolbar } from "@/components/list/ListToolbar";
import { ListFilterSelect } from "@/components/list/ListFilterSelect";
import { ListPagination } from "@/components/list/ListPagination";
import { FILTER_ALL, matchesAny } from "@/lib/list-utils";
import {
  filtrarMotoristasDisponiveis,
  filtrarVeiculosDisponiveis,
  recursoOcupadoEmViagem,
} from "@/lib/viagem-recursos";
import { getPapelVeiculo } from "@/lib/veiculo-utils";

export const Route = createFileRoute("/viagens/")({
  head: () => ({ meta: [{ title: "Viagens — ERP Transportadora" }] }),
  component: Page,
});

const enderecoVazio = (): Endereco => ({ cep: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", pais: "Brasil" });

function Page() {
  const tenantId = useActiveTenantId();
  const { data: viagens = [] } = useViagens();
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: clientes = [] } = useClientes();
  const { data: produtos = [] } = useProdutos();
  const save = useSaveViagem();
  const remove = useRemoveViagem();
  const { confirm, ConfirmDialogHost } = useConfirm();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Viagem | null>(null);

  const motoristasDisponiveis = useMemo(
    () => filtrarMotoristasDisponiveis(motoristas, viagens, form?.id),
    [motoristas, viagens, form?.id],
  );
  const veiculosTracaoDisponiveis = useMemo(
    () => filtrarVeiculosDisponiveis(veiculos, viagens, form?.id, [], "tracao"),
    [veiculos, viagens, form?.id],
  );
  const reboquesDisponiveis = useMemo(
    () =>
      filtrarVeiculosDisponiveis(
        veiculos,
        viagens,
        form?.id,
        form?.veiculo_principal_id ? [form.veiculo_principal_id] : [],
        "implemento",
      ),
    [veiculos, viagens, form?.id, form?.veiculo_principal_id],
  );

  const list = useListControls({
    items: viagens,
    searchFn: (v, q) => {
      const co = clientes.find((c) => c.id === v.cliente_origem_id);
      const cd = clientes.find((c) => c.id === v.cliente_destino_id);
      const m = motoristas.find((x) => x.id === v.motorista_id);
      const ve = veiculos.find((x) => x.id === v.veiculo_principal_id);
      const p = produtos.find((x) => x.id === v.produto_carga_id);
      const statusLabel = STATUS_VIAGEM.find((s) => s.value === v.status)?.label;
      return matchesAny(
        [v.numero_viagem, co?.nome, cd?.nome, m?.nome, ve?.placa, p?.nome, statusLabel, v.status, v.endereco_origem?.cidade, v.endereco_destino?.cidade],
        q,
      );
    },
    filterFn: (v, f) => !f.status || f.status === FILTER_ALL || v.status === f.status,
    initialFilters: { status: FILTER_ALL },
  });

  const novo = () => {
    void (async () => {
      const now = new Date().toISOString();
      const numero = await nextViagemNumero(tenantId);
      setForm({
        id: generateUuid(),
        transportadora_id: tenantId,
        numero_viagem: numero,
        status: "planejada",
        data_criacao: now,
        endereco_origem: enderecoVazio(),
        endereco_destino: enderecoVazio(),
        documentos: [],
        created_at: now,
        updated_at: now,
      });
      setOpen(true);
    })();
  };

  const salvar = () => {
    if (!form) return;

    if (form.motorista_id) {
      const viagemOcupada = recursoOcupadoEmViagem(viagens, {
        motoristaId: form.motorista_id,
        excluirViagemId: form.id,
      });
      if (viagemOcupada) {
        toast.error(
          `Motorista já está alocado na viagem #${String(viagemOcupada.numero_viagem).padStart(5, "0")}`,
        );
        return;
      }
    }
    if (form.veiculo_principal_id) {
      const vp = veiculos.find((x) => x.id === form.veiculo_principal_id);
      if (vp && getPapelVeiculo(vp) !== "tracao") {
        toast.error("Veículo principal deve ser de tração (cavalo, truck, toco…)");
        return;
      }
      const viagemOcupada = recursoOcupadoEmViagem(viagens, {
        veiculoId: form.veiculo_principal_id,
        excluirViagemId: form.id,
      });
      if (viagemOcupada) {
        toast.error(
          `Veículo principal já está na viagem #${String(viagemOcupada.numero_viagem).padStart(5, "0")}`,
        );
        return;
      }
    }
    if (form.veiculo_reboque_id) {
      const vr = veiculos.find((x) => x.id === form.veiculo_reboque_id);
      if (vr && getPapelVeiculo(vr) !== "implemento") {
        toast.error("Reboque/carreta deve ser um implemento (carreta, baú, tanque…)");
        return;
      }
      const viagemOcupada = recursoOcupadoEmViagem(viagens, {
        veiculoId: form.veiculo_reboque_id,
        excluirViagemId: form.id,
      });
      if (viagemOcupada) {
        toast.error(
          `Reboque já está na viagem #${String(viagemOcupada.numero_viagem).padStart(5, "0")}`,
        );
        return;
      }
    }

    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success(`Viagem #${String(form.numero_viagem).padStart(5, "0")} salva`);
    setOpen(false);
  };

  const aplicarEnderecoCliente = (clienteId: string, qual: "origem" | "destino") => {
    const c = clientes.find((x) => x.id === clienteId);
    if (!c || !form) return;
    if (qual === "origem") setForm({ ...form, cliente_origem_id: clienteId, endereco_origem: { ...c.endereco } });
    else setForm({ ...form, cliente_destino_id: clienteId, endereco_destino: { ...c.endereco } });
  };

  const pedirRemocao = (v: Viagem) => {
    confirm({
      title: "Remover viagem?",
      description: `A viagem #${String(v.numero_viagem).padStart(5, "0")} será excluída permanentemente. Esta ação não pode ser desfeita.`,
      confirmLabel: "Remover",
      destructive: true,
      onConfirm: () => {
        remove.mutate(v.id);
        toast.success("Viagem removida");
      },
    });
  };

  return (
    <div className="space-y-4">
      <ConfirmDialogHost />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Viagens</h1>
          <p className="text-sm text-muted-foreground">
            Módulo central da operação · crie, acompanhe e finalize viagens · {viagens.length} cadastradas
          </p>
        </div>
        <Button onClick={novo}><Plus className="h-4 w-4 mr-2" /> Nova viagem</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <ListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Buscar viagem, cliente, motorista, placa…"
            totalItems={list.totalItems}
            page={list.page}
            pageSize={list.pageSize}
          >
            <ListFilterSelect
              label="Status"
              value={list.filters.status ?? FILTER_ALL}
              onChange={(v) => list.setFilter("status", v)}
              options={STATUS_VIAGEM.map((s) => ({ value: s.value, label: s.label }))}
            />
          </ListToolbar>
        </div>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nº</TableHead><TableHead>Origem → Destino</TableHead>
            <TableHead>Motorista</TableHead><TableHead>Veículo</TableHead>
            <TableHead>Produto</TableHead><TableHead>Status</TableHead><TableHead className="w-[140px]"></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {list.totalItems === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {list.hasActiveFilters ? "Nenhuma viagem encontrada." : "Nenhuma viagem."}
              </TableCell></TableRow>
            )}
            {list.paginated.map((v) => {
              const co = clientes.find((c) => c.id === v.cliente_origem_id);
              const cd = clientes.find((c) => c.id === v.cliente_destino_id);
              const m = motoristas.find((x) => x.id === v.motorista_id);
              const ve = veiculos.find((x) => x.id === v.veiculo_principal_id);
              const p = produtos.find((x) => x.id === v.produto_carga_id);
              return (
                <TableRow key={v.id}>
                  <TableCell className="font-mono">
                    <Link to="/viagens/$id" params={{ id: v.id }} className="hover:underline">
                      #{String(v.numero_viagem).padStart(5, "0")}
                    </Link>
                  </TableCell>
                  <TableCell>{co?.nome ?? "—"} → {cd?.nome ?? "—"}</TableCell>
                  <TableCell>{m?.nome ?? "—"}</TableCell>
                  <TableCell>{ve?.placa ?? "—"}</TableCell>
                  <TableCell>{p?.nome ?? "—"}</TableCell>
                  <TableCell>
                    <ViagemStatusBadge status={v.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" asChild title="Ver detalhes">
                        <Link to="/viagens/$id" params={{ id: v.id }}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" title="Remover" onClick={() => pedirRemocao(v)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="px-4 pb-4">
          <ListPagination page={list.page} totalPages={list.totalPages} totalItems={list.totalItems} onPageChange={list.setPage} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova viagem #{form ? String(form.numero_viagem).padStart(5, "0") : ""}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StatusViagem })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_VIAGEM.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Motorista</Label>
                  <Select value={form.motorista_id ?? ""} onValueChange={(v) => setForm({ ...form, motorista_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {motoristasDisponiveis.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {motoristasDisponiveis.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Todos os motoristas estão em viagens ativas.</p>
                  )}
                </div>
                <div>
                  <Label>Veículo principal (tração)</Label>
                  <Select
                    value={form.veiculo_principal_id ?? ""}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        veiculo_principal_id: v,
                        veiculo_reboque_id: form.veiculo_reboque_id === v ? undefined : form.veiculo_reboque_id,
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {veiculosTracaoDisponiveis.map((x) => (
                        <SelectItem key={x.id} value={x.id}>{x.placa} — {x.tipo_veiculo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {veiculosTracaoDisponiveis.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Nenhum cavalo/truck disponível (livre de viagem ativa e status operacional).
                    </p>
                  )}
                </div>
                <div>
                  <Label>Reboque / carreta (implemento)</Label>
                  <Select value={form.veiculo_reboque_id ?? ""} onValueChange={(v) => setForm({ ...form, veiculo_reboque_id: v })}>
                    <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                    <SelectContent>
                      {reboquesDisponiveis.map((x) => (
                        <SelectItem key={x.id} value={x.id}>{x.placa} — {x.tipo_veiculo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {reboquesDisponiveis.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Nenhum implemento disponível no momento.</p>
                  )}
                </div>
                <div>
                  <Label>Cliente origem</Label>
                  <Select value={form.cliente_origem_id ?? ""} onValueChange={(v) => aplicarEnderecoCliente(v, "origem")}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente destino</Label>
                  <Select value={form.cliente_destino_id ?? ""} onValueChange={(v) => aplicarEnderecoCliente(v, "destino")}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Produto / Carga</Label>
                  <Select value={form.produto_carga_id ?? ""} onValueChange={(v) => setForm({ ...form, produto_carga_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Quantidade</Label><Input type="number" value={form.quantidade ?? ""} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) || undefined })} /></div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={form.unidade_medida ?? ""} onValueChange={(v) => setForm({ ...form, unidade_medida: v as Viagem["unidade_medida"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNIDADES_MEDIDA.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Peso bruto (kg)</Label><Input type="number" value={form.peso_bruto ?? ""} onChange={(e) => setForm({ ...form, peso_bruto: Number(e.target.value) || undefined })} /></div>
                <div><Label>Peso líquido (kg)</Label><Input type="number" value={form.peso_liquido ?? ""} onChange={(e) => setForm({ ...form, peso_liquido: Number(e.target.value) || undefined })} /></div>
                <div><Label>Valor do frete</Label><Input type="number" step="0.01" value={form.valor_frete ?? ""} onChange={(e) => setForm({ ...form, valor_frete: Number(e.target.value) || undefined })} /></div>
                <div><Label>Forma de pagamento</Label><Input value={form.forma_pagamento ?? ""} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })} /></div>
                <div><Label>Saída prevista</Label><Input type="date" value={form.data_prevista_saida ?? ""} onChange={(e) => setForm({ ...form, data_prevista_saida: e.target.value })} /></div>
                <div><Label>Chegada prevista</Label><Input type="date" value={form.data_prevista_chegada ?? ""} onChange={(e) => setForm({ ...form, data_prevista_chegada: e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Endereços de origem/destino preenchidos automaticamente do cliente. Edite na tela de detalhes da viagem após criar.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar}>Criar viagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
