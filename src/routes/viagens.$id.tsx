import { createFileRoute } from "@tanstack/react-router";
import {
  useViagem,
  useSaveViagem,
  useSaveViagemEvento,
  useTransportadora,
  useActiveTenantId,
  useMotoristas,
  useVeiculos,
  useClientes,
  useProdutos,
  useViagemEventos,
  useViagemOcorrencias,
  useViagemLocalizacoes,
} from "@/data/store";
import { generateUuid } from "@/lib/uuid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViagemOperacionalHeader } from "@/components/viagem/ViagemOperacionalHeader";
import { GpsStatusPanel } from "@/components/viagem/GpsStatusPanel";
import { AddressForm } from "@/components/AddressForm";
import { DocumentUploader } from "@/components/DocumentUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useMemo } from "react";
import { useViagemLocalizacoesRealtime } from "@/hooks/use-viagem-localizacoes-realtime";
import type { Viagem } from "@/types";
import { STATUS_VIAGEM } from "@/types";
import { gerarPdfViagem } from "@/lib/pdf";
import { toast } from "sonner";
import { ViagemEventosTimeline } from "@/components/viagem/ViagemEventosTimeline";
import { ViagemOcorrenciasPanel } from "@/components/viagem/ViagemOcorrenciasPanel";
import { ViagemLocalizacoesPanel } from "@/components/viagem/ViagemLocalizacoesPanel";
import { ViagemRastreamentoMap } from "@/components/rastreamento/ViagemRastreamentoMap";
import { ViagemProgressoCard } from "@/components/viagem/ViagemProgressoCard";
import { ViagemAcessoClientePanel } from "@/components/viagem/ViagemAcessoClientePanel";
import { montarDadosMapaViagem } from "@/lib/rastreamento-mapa";
import { isViagemRastreavel } from "@/lib/viagem-rastreamento";
import { FinalizarViagemDialog } from "@/components/viagem/FinalizarViagemDialog";
import { calcularProgressoViagem } from "@/lib/viagem-progresso";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const { data: eventos = [] } = useViagemEventos(id);
  const { data: ocorrencias = [] } = useViagemOcorrencias(id);
  useViagemLocalizacoesRealtime(id);
  const { data: localizacoes = [] } = useViagemLocalizacoes(id);
  const save = useSaveViagem();
  const saveEvento = useSaveViagemEvento();

  const [form, setForm] = useState<Viagem | null>(null);
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  useEffect(() => { if (viagem) setForm(viagem); }, [viagem]);

  const dadosMapa = useMemo(() => {
    if (!form) return null;
    const motorista = motoristas.find((m) => m.id === form.motorista_id);
    const vPrincipal = veiculos.find((v) => v.id === form.veiculo_principal_id);
    const cOrigem = clientes.find((c) => c.id === form.cliente_origem_id);
    const cDestino = clientes.find((c) => c.id === form.cliente_destino_id);
    return montarDadosMapaViagem(form, localizacoes, motorista, vPrincipal, cOrigem, cDestino);
  }, [form, localizacoes, motoristas, veiculos, clientes]);

  if (!form) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const motorista = motoristas.find((m) => m.id === form.motorista_id);
  const vPrincipal = veiculos.find((v) => v.id === form.veiculo_principal_id);
  const vReboque = veiculos.find((v) => v.id === form.veiculo_reboque_id);
  const cOrigem = clientes.find((c) => c.id === form.cliente_origem_id);
  const cDestino = clientes.find((c) => c.id === form.cliente_destino_id);
  const produto = produtos.find((p) => p.id === form.produto_carga_id);
  const progresso = calcularProgressoViagem(form, localizacoes);

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

  const podeFinalizar = isViagemAtiva(form.status);

  const handleFinalizar = (motivo: string) => {
    const now = new Date().toISOString();
    const operadorNome = transportadora?.responsavel_nome?.trim() || "Operador da transportadora";
    const statusAnterior = form.status;

    const atualizada: Viagem = {
      ...form,
      status: "finalizada",
      data_real_chegada: form.data_real_chegada ?? now,
      finalizacao_origem: "operador",
      finalizacao_em: now,
      finalizacao_por_nome: operadorNome,
      finalizacao_motivo: motivo,
      updated_at: now,
    };

    save.mutate(atualizada);
    saveEvento.mutate({
      id: generateUuid(),
      transportadora_id: tenantId,
      viagem_id: id,
      tipo: "viagem_finalizada",
      titulo: "Viagem finalizada pelo operador",
      descricao: `Finalizada por ${operadorNome}. Motivo: ${motivo}`,
      status_anterior: statusAnterior,
      status_novo: "finalizada",
      origem: "operador",
      created_at: now,
    });

    setForm(atualizada);
    setFinalizarOpen(false);
    toast.success("Viagem finalizada");
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <ViagemOperacionalHeader
        viagem={form}
        origemLabel={cOrigem?.nome ?? form.endereco_origem.cidade}
        destinoLabel={cDestino?.nome ?? form.endereco_destino.cidade}
        motoristaNome={motorista?.nome}
        veiculoPlaca={vPrincipal?.placa}
        podeFinalizar={podeFinalizar}
        onFinalizar={() => setFinalizarOpen(true)}
        onSalvar={handleSave}
        onPdf={handlePdf}
        salvando={save.isPending}
      />

      <FinalizarViagemDialog
        open={finalizarOpen}
        onOpenChange={setFinalizarOpen}
        numeroViagem={form.numero_viagem}
        onConfirm={handleFinalizar}
        loading={save.isPending}
      />

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="eventos">Eventos ({eventos.length})</TabsTrigger>
          <TabsTrigger value="ocorrencias">Ocorrências ({ocorrencias.length})</TabsTrigger>
          <TabsTrigger value="localizacao">Localização ({localizacoes.length})</TabsTrigger>
          <TabsTrigger value="enderecos">Endereços</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="obs">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          {progresso.emAndamento || form.status === "finalizada" || form.status === "planejada" ? (
            <ViagemProgressoCard progresso={progresso} />
          ) : null}
          <ViagemAcessoClientePanel viagemId={form.id} numeroViagem={form.numero_viagem} />
          {form.status === "finalizada" && form.finalizacao_em && (
            <Card>
              <CardHeader><CardTitle className="text-base">Finalização</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  Por: <strong>{form.finalizacao_por_nome ?? "—"}</strong>
                  {" · "}
                  {form.finalizacao_origem === "motorista" ? "Motorista (PWA)" : "Operador (web)"}
                </p>
                <p className="text-muted-foreground">
                  {format(new Date(form.finalizacao_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {form.finalizacao_motivo && (
                  <p className="mt-2"><span className="text-muted-foreground">Motivo:</span> {form.finalizacao_motivo}</p>
                )}
              </CardContent>
            </Card>
          )}
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

        <TabsContent value="eventos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline operacional</CardTitle>
            </CardHeader>
            <CardContent>
              <ViagemEventosTimeline eventos={eventos} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocorrencias">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ocorrências da viagem</CardTitle>
            </CardHeader>
            <CardContent>
              <ViagemOcorrenciasPanel viagemId={id} ocorrencias={ocorrencias} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localizacao" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mapa da viagem</CardTitle>
              </CardHeader>
              <CardContent>
                <ViagemRastreamentoMap dados={dadosMapa} className="h-[420px] min-h-[320px]" />
                <p className="text-xs text-muted-foreground mt-2">
                  {isViagemRastreavel(form.status)
                    ? "Atualização automática enquanto o motorista envia GPS pelo app."
                    : "Rota planejada (origem e destino). Posição GPS aparece quando a viagem estiver em andamento."}
                </p>
              </CardContent>
            </Card>
            <GpsStatusPanel
              localizacoes={localizacoes}
              rastreavel={isViagemRastreavel(form.status)}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de localização</CardTitle>
            </CardHeader>
            <CardContent>
              <ViagemLocalizacoesPanel localizacoes={localizacoes} />
            </CardContent>
          </Card>
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
                uploadContext={{
                  transportadoraId: tenantId,
                  entidade: "viagens",
                  entidadeId: form.id,
                }}
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
