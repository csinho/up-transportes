import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Navigation, Radio, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ViagemLocalizacao } from "@/types";
import { cn } from "@/lib/utils";
import { formatPrecisaoMetros, formatVelocidadeKmh } from "@/lib/viagem-gps-metrics";

type Props = {
  localizacoes: ViagemLocalizacao[];
  rastreavel?: boolean;
  className?: string;
};

export function GpsStatusPanel({ localizacoes, rastreavel, className }: Props) {
  const ultima = localizacoes[0];
  const gpsAtivo = rastreavel && ultima != null;

  return (
    <Card className={cn("border-t-4 border-t-brand-orange", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-brand-orange" />
            Status GPS
          </span>
          <Badge
            variant={gpsAtivo ? "success" : "secondary"}
            className={cn(!gpsAtivo && "bg-muted text-muted-foreground")}
          >
            <Radio className="h-3 w-3 mr-1" />
            {gpsAtivo ? "Ativo" : "Sem sinal recente"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ultima ? (
          <>
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Última localização
              </p>
              <p className="font-mono text-sm">{ultima.latitude.toFixed(5)}, {ultima.longitude.toFixed(5)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {format(new Date(ultima.registrado_em), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gauge className="h-3 w-3" /> Velocidade
                </p>
                <p className="text-lg font-bold font-display mt-1">
                  {formatVelocidadeKmh(ultima.velocidade_kmh)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Precisão</p>
                <p className="text-lg font-bold font-display mt-1">
                  {formatPrecisaoMetros(ultima.precisao_metros)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {localizacoes.length} ponto{localizacoes.length !== 1 ? "s" : ""} no histórico
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aguardando primeira posição do motorista pelo app.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
