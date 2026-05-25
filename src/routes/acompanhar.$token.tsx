import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { MapPin, Radio, Loader2 } from "lucide-react";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { TransportadoraLogo } from "@/components/transportadora/TransportadoraLogo";
import { ViagemRastreamentoMap } from "@/components/rastreamento/ViagemRastreamentoMap";
import { ViagemProgressoCard } from "@/components/viagem/ViagemProgressoCard";
import { useAcompanhamentoCliente, useAcompanhamentoClienteRealtime } from "@/hooks/use-viagem-acesso-cliente";
import { montarDadosMapaViagem } from "@/lib/rastreamento-mapa";

export const Route = createFileRoute("/acompanhar/$token")({
  head: () => ({
    meta: [
      { title: "Acompanhar viagem" },
      { name: "description", content: "Monitoramento da sua carga em tempo real." },
    ],
  }),
  component: Page,
});

function Page() {
  const { token } = Route.useParams();
  const { data, isPending, isError } = useAcompanhamentoCliente(token);
  useAcompanhamentoClienteRealtime(token, data?.viagem?.id);

  const dadosMapa = useMemo(() => {
    if (!data?.valido || !data.viagem) return null;
    return montarDadosMapaViagem(data.viagem, data.localizacoes ?? []);
  }, [data]);

  if (isPending) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data?.valido || !data.viagem) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center gap-3">
        <MapPin className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Link inválido ou expirado</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Este link de acompanhamento não está mais disponível. Solicite um novo link à
          transportadora.
        </p>
      </div>
    );
  }

  const viagem = data.viagem;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <TransportadoraLogo
            transportadoraId={viagem.transportadora_id}
            nomeFantasia={data.transportadora?.nome_fantasia}
            logoUrl={data.transportadora?.logo_url}
            size="sm"
            showName
            sessionMode="none"
          />
          <Badge variant="secondary" className="gap-1 shrink-0">
            <Radio className="h-3 w-3 text-emerald-600" />
            Ao vivo
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sua viagem</p>
          <h1 className="text-2xl font-bold mt-1">
            #{String(viagem.numero_viagem).padStart(5, "0")}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <ViagemStatusBadge status={viagem.status} />
            <span className="text-sm text-muted-foreground">
              {data.cliente_origem_nome ?? "Origem"} → {data.cliente_destino_nome ?? "Destino"}
            </span>
          </div>
        </div>

        {dadosMapa && (
          <>
            <ViagemProgressoCard progresso={dadosMapa.progresso} />
            <ViagemRastreamentoMap dados={dadosMapa} className="h-[min(60vh,480px)]" />
          </>
        )}

        <p className="text-xs text-center text-muted-foreground pb-6">
          Atualização em tempo real · Apenas monitoramento desta viagem
        </p>
      </main>
    </div>
  );
}
