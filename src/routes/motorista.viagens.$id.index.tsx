import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { OFFLINE_MSG } from "@/lib/motorista-query-offline";
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
import { calcularProgressoViagem } from "@/lib/viagem-progresso";
import { isStatusComRastreamentoGps } from "@/lib/viagem-geolocalizacao-constants";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Viagem } from "@/types";
import { ChevronRight, MapPin, Navigation } from "lucide-react";

export const Route = createFileRoute("/motorista/viagens/$id/")({
  head: () => ({
    meta: [{ title: "Viagem — App Motorista" }],
  }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { session } = useMotoristaSession();
  const { data: viagem, isFetched, isError, error } = useMotoristaViagem(id);
  const { data: localizacoes = [] } = useMotoristaViagemLocalizacoes(id);
  const { data: eventos = [] } = useMotoristaViagemEventos(id);
  const { data: ocorrencias = [] } = useMotoristaViagemOcorrencias(id);
  const { data: veiculos = [] } = useMotoristaVeiculos();
  const { data: clientes = [] } = useMotoristaClientes();
  const [form, setForm] = useState<Viagem | null>(null);

  useEffect(() => {
    if (!viagem) return;
    setForm((prev) => {
      if (!prev || prev.id !== viagem.id) return viagem;
      const prevAt = new Date(prev.updated_at).getTime();
      const nextAt = new Date(viagem.updated_at).getTime();
      return nextAt >= prevAt ? viagem : prev;
    });
  }, [viagem]);

  if (!session) {
    return (
      <MotoristaShell titulo="Viagem" auth>
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
            ? "Esta viagem não está nos dados salvos no aparelho. Abra o dashboard com internet para atualizar."
            : "Viagem não encontrada."
          : "Carregando…";
    return (
      <MotoristaShell titulo="Viagem" voltarPara="/motorista/viagens">
        <p className="text-sm text-muted-foreground">{msg}</p>
        {isError && error instanceof Error && error.message === OFFLINE_MSG && (
          <p className="text-xs text-muted-foreground mt-2">
            Conecte-se à internet, entre no início do app e aguarde a mensagem de dados salvos.
          </p>
        )}
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

  const clienteOrigem = clientes.find((c) => c.id === form.cliente_origem_id);
  const clienteDestino = clientes.find((c) => c.id === form.cliente_destino_id);
  const progresso = calcularProgressoViagem(form, localizacoes);
  const gpsAtivo = isStatusComRastreamentoGps(form.status);
  const rastreando = isViagemAtiva(form.status);
  const qtdDocs = form.documentos?.length ?? 0;

  return (
    <MotoristaShell
      titulo={`#${String(form.numero_viagem).padStart(5, "0")}`}
      voltarPara="/motorista/viagens"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <ViagemStatusBadge status={form.status} />
          {gpsAtivo && (
            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5" />
              GPS ativo
            </span>
          )}
        </div>

        {gpsAtivo && (
          <p className="text-xs text-muted-foreground -mt-2">
            Mantenha o app aberto nesta viagem para registrar o trajeto a cada ~30 segundos. Com a
            tela bloqueada ou em outro app, o navegador pode pausar o GPS.
          </p>
        )}

        <Link
          to="/motorista/viagens/$id/detalhes"
          params={{ id }}
          className="block group"
        >
          <Card className="transition-colors group-hover:bg-muted/30 group-active:bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-start justify-between gap-2">
                <span className="flex items-start gap-2 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <span className="min-w-0">
                    {clienteOrigem?.nome ?? form.endereco_origem.cidade} →{" "}
                    {clienteDestino?.nome ?? form.endereco_destino.cidade}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>
                Origem: {form.endereco_origem.cidade}/{form.endereco_origem.uf}
              </p>
              <p>
                Destino: {form.endereco_destino.cidade}/{form.endereco_destino.uf}
              </p>
              <p className="text-xs text-primary font-medium pt-1">
                Ver detalhes e documentos
                {qtdDocs > 0 ? ` · ${qtdDocs} documento${qtdDocs !== 1 ? "s" : ""}` : ""}
              </p>
            </CardContent>
          </Card>
        </Link>

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
                  eventos={eventos}
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
