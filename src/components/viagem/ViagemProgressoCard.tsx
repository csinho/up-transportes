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
            accent="orange"
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
            accent="blue"
            label="Duração total prevista"
            valor={formatarDuracao(tempoTotalMinutos)}
          />
          <Metrica
            icon={MapPin}
            accent="green"
            label="Distância restante"
            valor={`${distanciaRestanteKm.toLocaleString("pt-BR")} km`}
            sub={`${distanciaPercorridaKm.toLocaleString("pt-BR")} / ${distanciaTotalKm.toLocaleString("pt-BR")} km`}
          />
          <Metrica
            icon={Gauge}
            accent="navy"
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

const metricaAccent: Record<string, { border: string; icon: string }> = {
  orange: { border: "border-t-brand-orange", icon: "text-brand-orange" },
  blue: { border: "border-t-brand-blue", icon: "text-brand-blue" },
  green: { border: "border-t-brand-success", icon: "text-brand-success" },
  navy: { border: "border-t-brand-navy", icon: "text-brand-navy" },
};

function Metrica({
  icon: Icon,
  label,
  valor,
  sub,
  destaque,
  accent = "blue",
}: {
  icon: typeof Timer;
  label: string;
  valor: string;
  sub?: string;
  destaque?: boolean;
  accent?: keyof typeof metricaAccent;
}) {
  const styles = metricaAccent[accent];
  return (
    <div className={cn("rounded-xl border border-t-4 p-4 space-y-1 bg-card", styles.border)}>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Icon className={cn("h-3.5 w-3.5", styles.icon)} />
        {label}
      </p>
      <p className={cn("text-3xl font-bold font-display tabular-nums", destaque && "text-brand-blue")}>{valor}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
