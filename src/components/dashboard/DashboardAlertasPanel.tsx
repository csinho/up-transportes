import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import type { AlertaOperacional, SeveridadeAlerta } from "@/lib/dashboard-alertas";
import { HORAS_PARADA_ALERTA } from "@/lib/dashboard-alertas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SEVERIDADE_STYLE: Record<
  SeveridadeAlerta,
  { badge: "destructive" | "default" | "secondary"; icon: typeof AlertTriangle }
> = {
  critica: { badge: "destructive", icon: ShieldAlert },
  alta: { badge: "default", icon: AlertTriangle },
  media: { badge: "secondary", icon: Clock },
};

const SEVERIDADE_LABEL: Record<SeveridadeAlerta, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
};

type Props = {
  alertas: AlertaOperacional[];
};

export function DashboardAlertasPanel({ alertas }: Props) {
  const criticos = alertas.filter((a) => a.severidade === "critica").length;
  const altos = alertas.filter((a) => a.severidade === "alta").length;

  return (
    <Card className={alertas.length > 0 ? "border-amber-500/40" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas operacionais
          {alertas.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {alertas.length} ativo{alertas.length > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Ocorrências críticas/altas, viagens atrasadas e paradas há mais de {HORAS_PARADA_ALERTA}h.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum alerta no momento. Operação dentro do esperado.
          </p>
        ) : (
          <>
            {(criticos > 0 || altos > 0) && (
              <p className="text-xs text-muted-foreground pb-1">
                {criticos > 0 && `${criticos} crítico${criticos > 1 ? "s" : ""}`}
                {criticos > 0 && altos > 0 && " · "}
                {altos > 0 && `${altos} alta prioridade`}
              </p>
            )}
            {alertas.slice(0, 8).map((alerta) => {
              const cfg = SEVERIDADE_STYLE[alerta.severidade];
              const Icon = cfg.icon;
              return (
                <Link
                  key={alerta.id}
                  to="/viagens/$id"
                  params={{ id: alerta.viagemId }}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-l-4 p-3 hover:bg-white hover:shadow-sm transition-all",
                    alerta.severidade === "critica" && "border-l-destructive border-destructive/30 bg-destructive/5",
                    alerta.severidade === "alta" && "border-l-amber-500 bg-amber-50/40",
                    alerta.severidade === "media" && "border-l-brand-blue/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 mt-0.5 shrink-0",
                      alerta.severidade === "critica" ? "text-destructive" : "text-amber-500",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{alerta.titulo}</p>
                      <Badge variant={cfg.badge} className="text-[10px]">
                        {SEVERIDADE_LABEL[alerta.severidade]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alerta.descricao}</p>
                  </div>
                </Link>
              );
            })}
            {alertas.length > 8 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                + {alertas.length - 8} alerta{alertas.length - 8 > 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
