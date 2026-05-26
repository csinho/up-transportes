import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { OFFLINE_MSG } from "@/lib/motorista-query-offline";
import {
  useMotoristaViagem,
  useMotoristaVeiculos,
  useMotoristaClientes,
} from "@/hooks/use-motorista-data";
import { MotoristaShell } from "@/components/motorista/MotoristaShell";
import { MotoristaDocumentosLista } from "@/components/motorista/MotoristaDocumentosLista";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { fmtMoeda } from "@/lib/motorista-app-path";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { EnderecoResumo } from "@/components/EnderecoResumo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Viagem } from "@/types";
import { FileText, MapPin, Truck } from "lucide-react";

export const Route = createFileRoute("/motorista/viagens/$id/detalhes")({
  head: () => ({
    meta: [{ title: "Detalhes da viagem — App Motorista" }],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { session } = useMotoristaSession();
  const { data: viagem, isFetched, isError, error } = useMotoristaViagem(id);
  const { data: veiculos = [] } = useMotoristaVeiculos();
  const { data: clientes = [] } = useMotoristaClientes();
  const [form, setForm] = useState<Viagem | null>(null);

  useEffect(() => {
    if (viagem) setForm(viagem);
  }, [viagem]);

  if (!session) {
    return (
      <MotoristaShell titulo="Detalhes" auth>
        <p className="text-sm text-muted-foreground text-center pt-8">Carregando…</p>
      </MotoristaShell>
    );
  }

  if (!form) {
    const offline = !isMotoristaOnline();
    const msg =
      isError && error instanceof Error
        ? error.message
        : isFetched && !viagem
          ? offline
            ? "Viagem não disponível offline."
            : "Viagem não encontrada."
          : "Carregando…";
    return (
      <MotoristaShell titulo="Detalhes" voltarPara="/motorista/viagens/$id" voltarParams={{ id }}>
        <p className="text-sm text-muted-foreground">{msg}</p>
        {isError && error instanceof Error && error.message === OFFLINE_MSG && (
          <p className="text-xs text-muted-foreground mt-2">Conecte-se para atualizar os dados.</p>
        )}
      </MotoristaShell>
    );
  }

  if (form.motorista_id !== session.motoristaId) {
    return (
      <MotoristaShell titulo="Detalhes" voltarPara="/motorista/viagens/$id" voltarParams={{ id }}>
        <p className="text-sm text-destructive">Esta viagem não está atribuída a você.</p>
      </MotoristaShell>
    );
  }

  const veiculo = veiculos.find((v) => v.id === form.veiculo_principal_id);
  const reboque = veiculos.find((v) => v.id === form.veiculo_reboque_id);
  const clienteOrigem = clientes.find((c) => c.id === form.cliente_origem_id);
  const clienteDestino = clientes.find((c) => c.id === form.cliente_destino_id);
  const documentos = form.documentos ?? [];

  return (
    <MotoristaShell
      titulo={`Detalhes #${String(form.numero_viagem).padStart(5, "0")}`}
      voltarPara="/motorista/viagens/$id"
      voltarParams={{ id }}
    >
      <div className="space-y-4">
        <ViagemStatusBadge status={form.status} />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Rota
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1">
                Origem — {clienteOrigem?.nome ?? "—"}
              </p>
              <EnderecoResumo endereco={form.endereco_origem} />
            </div>
            <Separator />
            <div>
              <p className="font-medium text-foreground mb-1">
                Destino — {clienteDestino?.nome ?? "—"}
              </p>
              <EnderecoResumo endereco={form.endereco_destino} />
            </div>
          </CardContent>
        </Card>

        {veiculo && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">{veiculo.placa}</strong> — {veiculo.marca}{" "}
                {veiculo.modelo}
              </p>
              <p>{veiculo.tipo_veiculo}</p>
              {reboque && (
                <p>
                  Reboque: <strong className="text-foreground">{reboque.placa}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {(form.quantidade != null || form.valor_frete != null) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Carga e frete</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {form.quantidade != null && (
                <p>
                  Quantidade: {form.quantidade} {form.unidade_medida ?? ""}
                </p>
              )}
              {form.valor_frete != null && <p>Frete: {fmtMoeda(form.valor_frete)}</p>}
              {form.forma_pagamento && <p>Pagamento: {form.forma_pagamento}</p>}
            </CardContent>
          </Card>
        )}

        {form.finalizacao_motivo && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Observação da entrega</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{form.finalizacao_motivo}</CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos ({documentos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Notas fiscais, CT-e, guias e comprovantes enviados pela transportadora ou registrados
              na entrega.
            </p>
            <MotoristaDocumentosLista documentos={documentos} />
          </CardContent>
        </Card>
      </div>
    </MotoristaShell>
  );
}
