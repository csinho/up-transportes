import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useActiveTenantId } from "@/data/store";
import {
  useMotoristaViagem,
  useMotoristaViagemLocalizacoes,
  useMotoristaViagemEventos,
  useMotoristaViagemOcorrencias,
  useMotoristaVeiculos,
  useMotoristaClientes,
} from "@/hooks/use-motorista-data";
import { MotoristaShell } from "@/components/motorista/MotoristaShell";
import { MotoristaViagemAcoes } from "@/components/motorista/MotoristaViagemAcoes";
import { MotoristaOcorrenciasCard } from "@/components/motorista/MotoristaOcorrenciasCard";
import { ViagemProgressoCard } from "@/components/viagem/ViagemProgressoCard";
import { ViagemEventosTimeline } from "@/components/viagem/ViagemEventosTimeline";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { useViagemGeolocalizacao } from "@/hooks/use-viagem-geolocalizacao";
import { calcularProgressoViagem } from "@/lib/viagem-progresso";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { requireMotoristaSession } from "@/lib/motorista-auth-route";
import { fmtMoeda } from "@/lib/motorista-app-path";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_VIAGEM } from "@/types";
import type { Viagem } from "@/types";
import { MapPin, Navigation } from "lucide-react";

export const Route = createFileRoute("/motorista/viagens/$id")({
  beforeLoad: requireMotoristaSession,
  head: () => ({
    meta: [{ title: "Viagem — App Motorista" }],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { session } = useMotoristaSession();
  const tenantId = useActiveTenantId();
  const { data: viagem } = useMotoristaViagem(id);
  const { data: localizacoes = [] } = useMotoristaViagemLocalizacoes(id);
  const { data: eventos = [] } = useMotoristaViagemEventos(id);
  const { data: ocorrencias = [] } = useMotoristaViagemOcorrencias(id);
  const { data: veiculos = [] } = useMotoristaVeiculos();
  const { data: clientes = [] } = useMotoristaClientes();
  const [form, setForm] = useState<Viagem | null>(null);

  useEffect(() => {
    if (viagem) setForm(viagem);
  }, [viagem]);

  useViagemGeolocalizacao({
    viagem: form ?? undefined,
    motoristaId: session?.motoristaId,
    tenantId,
    enabled: !!session && form?.motorista_id === session.motoristaId,
  });

  if (!session) {
    return (
      <MotoristaShell titulo="Viagem" auth>
        <p className="text-sm text-muted-foreground text-center pt-8">Carregando…</p>
      </MotoristaShell>
    );
  }

  if (!form) {
    return (
      <MotoristaShell titulo="Viagem" voltarPara="/motorista/viagens">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </MotoristaShell>
    );
  }

  if (form.motorista_id !== session.motoristaId) {
    return (
      <MotoristaShell titulo="Viagem" voltarPara="/motorista/viagens">
        <p className="text-sm text-destructive">Esta viagem não está atribuída a você.</p>
      </MotoristaShell>
    );
  }

  const veiculo = veiculos.find((v) => v.id === form.veiculo_principal_id);
  const clienteOrigem = clientes.find((c) => c.id === form.cliente_origem_id);
  const clienteDestino = clientes.find((c) => c.id === form.cliente_destino_id);
  const progresso = calcularProgressoViagem(form, localizacoes);
  const statusLabel = STATUS_VIAGEM.find((s) => s.value === form.status)?.label ?? form.status;
  const rastreando = isViagemAtiva(form.status);

  return (
    <MotoristaShell
      titulo={`#${String(form.numero_viagem).padStart(5, "0")}`}
      voltarPara="/motorista/viagens"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant="secondary">{statusLabel}</Badge>
          {rastreando && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5" />
              GPS ativo em trânsito
            </span>
          )}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {clienteOrigem?.nome ?? form.endereco_origem.cidade} →{" "}
                {clienteDestino?.nome ?? form.endereco_destino.cidade}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>
              Origem: {form.endereco_origem.cidade}/{form.endereco_origem.uf}
            </p>
            <p>
              Destino: {form.endereco_destino.cidade}/{form.endereco_destino.uf}
            </p>
            {veiculo && (
              <p>
                Veículo: {veiculo.placa} — {veiculo.marca} {veiculo.modelo}
              </p>
            )}
            {form.valor_frete != null && <p>Frete: {fmtMoeda(form.valor_frete)}</p>}
          </CardContent>
        </Card>

        <ViagemProgressoCard progresso={progresso} compact />

        {rastreando && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Atualizar status</CardTitle>
              </CardHeader>
              <CardContent>
                <MotoristaViagemAcoes
                  viagem={form}
                  motoristaId={session.motoristaId}
                  motoristaNome={session.nome}
                  onUpdated={setForm}
                />
              </CardContent>
            </Card>

            <MotoristaOcorrenciasCard
              viagem={form}
              ocorrencias={ocorrencias}
              motoristaId={session.motoristaId}
              onViagemUpdated={setForm}
            />
          </>
        )}

        {eventos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <ViagemEventosTimeline eventos={eventos.slice(0, 10)} />
            </CardContent>
          </Card>
        )}
      </div>
    </MotoristaShell>
  );
}
