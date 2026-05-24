import { Clock, Gauge, MapPin, Route, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ProgressoViagem } from "@/lib/viagem-progresso";
import { formatarDataHora, formatarDuracao } from "@/lib/viagem-progresso";
import { cn } from "@/lib/utils";

type Props = {
  progresso: ProgressoViagem;
  compact?: boolean;
  className?: string;
};

export function ViagemProgressoCard({ progresso, compact, className }: Props) {
  const {
    percentualConcluido,
    distanciaTotalKm,
    distanciaPercorridaKm,
    distanciaRestanteKm,
    tempoTotalMinutos,
    tempoDecorridoMinutos,
    tempoRestanteMinutos,
    previsaoChegada,
    previsaoChegadaAgendada,
    atrasoMinutos,
    velocidadeMediaKmh,
    emAndamento,
    aguardandoInicio,
  } = progresso;

  const atrasado = atrasoMinutos != null && atrasoMinutos > 15;
  const adiantado = atrasoMinutos != null && atrasoMinutos < -15;

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-semibold tabular-nums">{percentualConcluido.toFixed(1)}%</span>
        </div>
        <Progress value={percentualConcluido} className="h-2" />
        {emAndamento && (
          <p className="text-xs text-muted-foreground">
            Restam <strong className="text-foreground">{formatarDuracao(tempoRestanteMinutos)}</strong>
            {" · "}
            ETA {formatarDataHora(previsaoChegada)}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Progresso do trajeto
          </span>
          <Badge variant="secondary" className="font-mono tabular-nums">
            {percentualConcluido.toFixed(1)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentualConcluido} className="h-3" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Metrica
            icon={Timer}
            label={aguardandoInicio && !emAndamento ? "Viagem prevista" : "Tempo restante"}
            valor={
              emAndamento
                ? formatarDuracao(tempoRestanteMinutos)
                : aguardandoInicio
                  ? formatarDuracao(tempoTotalMinutos)
                  : percentualConcluido >= 100
                    ? "Concluída"
                    : "—"
            }
            destaque={emAndamento}
            sub={aguardandoInicio && !emAndamento ? "Aguardando saída / GPS" : undefined}
          />
          <Metrica
            icon={Clock}
            label="Duração total prevista"
            valor={formatarDuracao(tempoTotalMinutos)}
          />
          <Metrica
            icon={MapPin}
            label="Distância restante"
            valor={`${distanciaRestanteKm.toLocaleString("pt-BR")} km`}
            sub={`${distanciaPercorridaKm.toLocaleString("pt-BR")} / ${distanciaTotalKm.toLocaleString("pt-BR")} km`}
          />
          <Metrica
            icon={Gauge}
            label="Vel. média"
            valor={velocidadeMediaKmh != null ? `${velocidadeMediaKmh} km/h` : "—"}
            sub={emAndamento ? `Decorrido: ${formatarDuracao(tempoDecorridoMinutos)}` : undefined}
          />
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Previsão de chegada (ETA): </span>
            <strong>{formatarDataHora(previsaoChegada)}</strong>
          </p>
          {previsaoChegadaAgendada && (
            <p className="text-muted-foreground text-xs">
              Agendada: {formatarDataHora(previsaoChegadaAgendada)}
              {atrasoMinutos != null && (
                <>
                  {" · "}
                  {atrasado && (
                    <span className="text-destructive font-medium">
                      Atraso estimado: {formatarDuracao(atrasoMinutos)}
                    </span>
                  )}
                  {adiantado && (
                    <span className="text-green-600 dark:text-green-500 font-medium">
                      Adiantado: {formatarDuracao(Math.abs(atrasoMinutos))}
                    </span>
                  )}
                  {!atrasado && !adiantado && atrasoMinutos !== 0 && (
                    <span>No horário previsto</span>
                  )}
                </>
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metrica({
  icon: Icon,
  label,
  valor,
  sub,
  destaque,
}: {
  icon: typeof Timer;
  label: string;
  valor: string;
  sub?: string;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-md border p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={cn("font-semibold tabular-nums", destaque && "text-primary")}>{valor}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
