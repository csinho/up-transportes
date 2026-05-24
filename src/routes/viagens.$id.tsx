import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useViagem,
  useSaveViagem,
  useTransportadora,
  useActiveTenantId,
  useMotoristas,
  useVeiculos,
  useClientes,
  useProdutos,
} from "@/data/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { DocumentUploader } from "@/components/DocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import type { Viagem } from "@/types";
import { STATUS_VIAGEM } from "@/types";
import { gerarPdfViagem } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/viagens/$id")({
  head: () => ({ meta: [{ title: "Detalhe da viagem" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const tenantId = useActiveTenantId();
  const { data: viagem } = useViagem(id);
  const { data: transportadora } = useTransportadora(tenantId);
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: clientes = [] } = useClientes();
  const { data: produtos = [] } = useProdutos();
  const save = useSaveViagem();

  const [form, setForm] = useState<Viagem | null>(null);
  useEffect(() => { if (viagem) setForm(viagem); }, [viagem]);

  if (!form) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const motorista = motoristas.find((m) => m.id === form.motorista_id);
  const vPrincipal = veiculos.find((v) => v.id === form.veiculo_principal_id);
  const vReboque = veiculos.find((v) => v.id === form.veiculo_reboque_id);
  const cOrigem = clientes.find((c) => c.id === form.cliente_origem_id);
  const cDestino = clientes.find((c) => c.id === form.cliente_destino_id);
  const produto = produtos.find((p) => p.id === form.produto_carga_id);

  const handleSave = () => {
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Viagem atualizada");
  };

  const handlePdf = async () => {
    if (!transportadora) return toast.error("Configure a transportadora primeiro");
    try {
      await gerarPdfViagem({
        viagem: form,
        transportadora,
        motorista,
        veiculoPrincipal: vPrincipal,
        veiculoReboque: vReboque,
        clienteOrigem: cOrigem,
        clienteDestino: cDestino,
        produto,
      });
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar PDF");
    }
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex justify-between items-start gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild><Link to="/viagens"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link></Button>
          <h1 className="text-2xl font-bold mt-2">Viagem #{String(form.numero_viagem).padStart(5, "0")}</h1>
          <div className="flex gap-2 items-center mt-1">
            <Badge variant="secondary">{STATUS_VIAGEM.find(s => s.value === form.status)?.label}</Badge>
            <span className="text-sm text-muted-foreground">
              {cOrigem?.nome ?? "—"} → {cDestino?.nome ?? "—"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} variant="outline"><Save className="h-4 w-4 mr-2" /> Salvar</Button>
          <Button onClick={handlePdf}><FileText className="h-4 w-4 mr-2" /> Gerar PDF</Button>
        </div>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="enderecos">Endereços</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="obs">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Motorista</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>{motorista?.nome ?? "—"}</strong></p>
                <p className="text-muted-foreground">{motorista?.cpf}</p>
                <p className="text-muted-foreground">{motorista?.telefone_principal}</p>
                <p className="text-muted-foreground">CNH: {motorista?.cnh.numero} ({motorista?.cnh.categoria})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Veículos</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>{vPrincipal?.placa}</strong> — {vPrincipal?.tipo_veiculo}</p>
                <p className="text-muted-foreground">RENAVAM: {vPrincipal?.renavam}</p>
                {vReboque && <p>Reboque: <strong>{vReboque.placa}</strong></p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Carga</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>{produto?.nome ?? "—"}</strong></p>
                <p className="text-muted-foreground">{produto?.categoria}</p>
                <p>{form.quantidade ?? "—"} {form.unidade_medida ?? produto?.unidade_medida ?? ""}</p>
                <p className="text-muted-foreground">Peso bruto: {form.peso_bruto ?? "—"} kg · líq.: {form.peso_liquido ?? "—"} kg</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Financeiro</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Frete: <strong>{form.valor_frete?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "—"}</strong></p>
                <p className="text-muted-foreground">Pagamento: {form.forma_pagamento ?? "—"}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enderecos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Origem (Ponto A) — {cOrigem?.nome ?? "—"}</CardTitle></CardHeader>
            <CardContent><AddressForm value={form.endereco_origem} onChange={(e) => setForm({ ...form, endereco_origem: e })} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Destino (Ponto B) — {cDestino?.nome ?? "—"}</CardTitle></CardHeader>
            <CardContent><AddressForm value={form.endereco_destino} onChange={(e) => setForm({ ...form, endereco_destino: e })} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader><CardTitle className="text-base">Documentos da viagem</CardTitle></CardHeader>
            <CardContent>
              <DocumentUploader
                fiscal
                documentos={form.documentos}
                onChange={(d) => setForm({ ...form, documentos: d })}
                tiposSugeridos={["NF-e", "DANFE", "CT-e", "DACTE", "MDF-e", "DAMDFE", "Nota Fiscal", "Guia", "Ordem de coleta", "Ordem de carregamento", "Comprovante de entrega", "Canhoto"]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obs" className="space-y-4">
          <div>
            <Label>Observações operacionais (aparecem no PDF)</Label>
            <Textarea rows={4} value={form.observacoes_operacionais ?? ""} onChange={(e) => setForm({ ...form, observacoes_operacionais: e.target.value })} />
          </div>
          <div>
            <Label>Observações internas</Label>
            <Textarea rows={4} value={form.observacoes_internas ?? ""} onChange={(e) => setForm({ ...form, observacoes_internas: e.target.value })} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
