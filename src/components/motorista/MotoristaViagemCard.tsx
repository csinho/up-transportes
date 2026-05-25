import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Viagem } from "@/types";
import { STATUS_VIAGEM } from "@/types";
import { fmtMoeda } from "@/lib/motorista-app-path";

type Props = {
  viagem: Viagem;
};

export function MotoristaViagemCard({ viagem }: Props) {
  const statusLabel = STATUS_VIAGEM.find((s) => s.value === viagem.status)?.label ?? viagem.status;

  return (
    <Link to="/motorista/viagens/$id" params={{ id: viagem.id }} preload={false} className="block">
      <Card className="transition-colors hover:bg-accent/30 active:scale-[0.99]">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">
                Viagem #{String(viagem.numero_viagem).padStart(5, "0")}
              </span>
              <Badge variant="secondary">{statusLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-start gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {viagem.endereco_origem.cidade}/{viagem.endereco_origem.uf} →{" "}
                {viagem.endereco_destino.cidade}/{viagem.endereco_destino.uf}
              </span>
            </p>
            {viagem.valor_frete != null && (
              <p className="text-xs font-medium">{fmtMoeda(viagem.valor_frete)}</p>
            )}
            {viagem.data_prevista_chegada && (
              <p className="text-xs text-muted-foreground">
                Chegada prevista:{" "}
                {format(new Date(viagem.data_prevista_chegada), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </CardContent>
      </Card>
    </Link>
  );
}
