import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Flag, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ViagemStatusBadge } from "@/components/viagem/ViagemStatusBadge";
import { ViagemRouteLabel } from "@/components/operacional/ViagemRouteLabel";
import type { Viagem } from "@/types";

type Props = {
  viagem: Viagem;
  origemLabel: string;
  destinoLabel: string;
  motoristaNome?: string;
  veiculoPlaca?: string;
  podeFinalizar: boolean;
  onFinalizar: () => void;
  onSalvar: () => void;
  onPdf: () => void;
  salvando?: boolean;
};

export function ViagemOperacionalHeader({
  viagem,
  origemLabel,
  destinoLabel,
  motoristaNome,
  veiculoPlaca,
  podeFinalizar,
  onFinalizar,
  onSalvar,
  onPdf,
  salvando,
}: Props) {
  return (
    <Card className="border-l-4 border-l-brand-blue overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 pb-4 flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-blue-50/80 to-transparent">
          <div className="min-w-0 space-y-3">
            <Button variant="ghost" size="sm" asChild className="-ml-2 h-8">
              <Link to="/viagens">
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold font-display tabular-nums text-brand-navy">
                #{String(viagem.numero_viagem).padStart(5, "0")}
              </h1>
              <ViagemStatusBadge status={viagem.status} />
            </div>
            <ViagemRouteLabel origem={origemLabel} destino={destinoLabel} />
            <div className="flex flex-wrap gap-2">
              {motoristaNome && (
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  Motorista: {motoristaNome}
                </span>
              )}
              {veiculoPlaca && (
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-mono font-medium">
                  {veiculoPlaca}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {podeFinalizar && (
              <Button variant="destructive" onClick={onFinalizar}>
                <Flag className="h-4 w-4 mr-2" /> Finalizar viagem
              </Button>
            )}
            <Button onClick={onSalvar} variant="outline" disabled={salvando}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
            <Button onClick={onPdf} variant="default">
              <FileText className="h-4 w-4 mr-2" /> Gerar PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
