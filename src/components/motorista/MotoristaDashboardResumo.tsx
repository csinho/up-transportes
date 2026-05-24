import { DollarSign, Route, Truck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ResumoMotorista } from "@/lib/motorista-stats";
import { fmtMoeda } from "@/lib/motorista-app-path";

type Props = {
  resumo: ResumoMotorista;
  motoristaNome: string;
};

export function MotoristaDashboardResumo({ resumo, motoristaNome }: Props) {
  const primeiroNome = motoristaNome.split(" ")[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Olá, {primeiroNome}!</h1>
        <p className="text-sm text-muted-foreground">Resumo das suas viagens</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Route className="h-4 w-4" />
              <span className="text-xs">Ativas</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{resumo.viagensAtivas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Concluídas</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{resumo.viagensFinalizadas}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Total em fretes (concluídas)</span>
            </div>
            <p className="text-2xl font-bold">{fmtMoeda(resumo.totalFreteRecebido)}</p>
            {resumo.viagensFinalizadas > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Média por viagem: {fmtMoeda(resumo.freteMedio)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Truck className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{motoristaNome}</p>
              <p className="text-xs text-muted-foreground">
                {resumo.totalViagens} viagem{resumo.totalViagens !== 1 ? "ns" : ""} no histórico
                {resumo.viagensCanceladas > 0 && ` · ${resumo.viagensCanceladas} cancelada(s)`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
