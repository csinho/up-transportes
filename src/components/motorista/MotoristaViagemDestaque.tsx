import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Timer, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Viagem } from "@/types";
import { STATUS_VIAGEM } from "@/types";
import { useMotoristaViagemLocalizacoes } from "@/hooks/use-motorista-data";
import { calcularProgressoViagem, formatarDuracao, type ProgressoViagem } from "@/lib/viagem-progresso";
import { fmtMoeda } from "@/lib/motorista-app-path";

type Props = {
  viagem: Viagem;
};

export function MotoristaViagemDestaque({ viagem }: Props) {
  const { data: localizacoes = [] } = useMotoristaViagemLocalizacoes(viagem.id);
  const [progresso, setProgresso] = useState<ProgressoViagem | null>(null);

  useEffect(() => {
    setProgresso(calcularProgressoViagem(viagem, localizacoes));
    const timer = window.setInterval(() => {
      setProgresso(calcularProgressoViagem(viagem, localizacoes));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [viagem, localizacoes]);

  const statusLabel = STATUS_VIAGEM.find((s) => s.value === viagem.status)?.label ?? viagem.status;
  const pct = progresso?.percentualConcluido ?? 0;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Viagem em andamento</CardTitle>
          <Badge>{statusLabel}</Badge>
        </div>
        <p className="text-sm font-medium">
          #{String(viagem.numero_viagem).padStart(5, "0")}
          {viagem.valor_frete != null && (
            <span className="text-muted-foreground font-normal"> · {fmtMoeda(viagem.valor_frete)}</span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm flex items-start gap-2">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <span>
            {viagem.endereco_origem.cidade}/{viagem.endereco_origem.uf} →{" "}
            {viagem.endereco_destino.cidade}/{viagem.endereco_destino.uf}
          </span>
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span className="font-semibold text-foreground tabular-nums">
              {pct.toFixed(0)}%
            </span>
          </div>
          <Progress value={pct} className="h-2.5" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-background/80 border p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Tempo em viagem
            </p>
            <p className="font-semibold mt-1 tabular-nums" suppressHydrationWarning>
              {progresso?.emAndamento
                ? formatarDuracao(progresso.tempoDecorridoMinutos)
                : "Aguardando saída"}
            </p>
          </div>
          <div className="rounded-lg bg-background/80 border p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" /> Falta estimado
            </p>
            <p className="font-semibold mt-1 tabular-nums" suppressHydrationWarning>
              {progresso?.emAndamento
                ? formatarDuracao(progresso.tempoRestanteMinutos)
                : "—"}
            </p>
          </div>
        </div>

        <Button className="w-full" size="lg" asChild>
          <Link to="/motorista/viagens/$id" params={{ id: viagem.id }} preload={false}>
            Ver detalhes e atualizar status
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
