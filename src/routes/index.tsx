import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useMotoristas,
  useVeiculos,
  useProdutos,
  useViagens,
  usePneus,
  useLancamentos,
} from "@/data/store";
import { Users, Truck, Package, Route as RouteIcon, AlertTriangle, CircleDot, Wallet } from "lucide-react";
import { differenceInDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ERP Transportadora" },
      { name: "description", content: "Visão geral da operação da transportadora." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: motoristas = [] } = useMotoristas();
  const { data: veiculos = [] } = useVeiculos();
  const { data: produtos = [] } = useProdutos();
  const { data: viagens = [] } = useViagens();
  const { data: pneus = [] } = usePneus();
  const { data: lancamentos = [] } = useLancamentos();

  const viagensPorStatus = (s: string) => viagens.filter((v) => v.status === s).length;

  const saldoFinanceiro = lancamentos
    .filter((l) => l.status === "pago")
    .reduce((s, l) => s + (l.tipo === "receita" ? l.valor : -l.valor), 0);
  const pneusEstoque = pneus.filter((p) => p.status === "estoque").length;
  const pneusSulcoBaixo = pneus.filter((p) => p.sulco_atual_mm != null && p.sulco_atual_mm <= 3).length;

  const cnhVencendo = motoristas.filter((m) => {
    if (!m.cnh?.data_validade) return false;
    const d = differenceInDays(new Date(m.cnh.data_validade), new Date());
    return d <= 30;
  });
  const docsVeiculoVencendo = veiculos.flatMap((v) =>
    (v.documentos ?? []).filter((d) => {
      if (!d.data_validade) return false;
      const dd = differenceInDays(new Date(d.data_validade), new Date());
      return dd <= 30;
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua operação.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={RouteIcon} label="Viagens" value={viagens.length} />
        <StatCard icon={Users} label="Motoristas" value={motoristas.length} />
        <StatCard icon={Truck} label="Veículos" value={veiculos.length} />
        <StatCard icon={CircleDot} label="Pneus estoque" value={pneusEstoque} />
        <StatCard icon={Wallet} label="Saldo (pagos)" value={saldoFinanceiro} money />
        <StatCard icon={Package} label="Produtos" value={produtos.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Viagens por status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Planejada", "planejada"],
                ["Aguardando carregamento", "aguardando_carregamento"],
                ["Em carregamento", "em_carregamento"],
                ["Em trânsito", "em_transito"],
                ["Parada", "parada"],
                ["Em descarga", "em_descarga"],
                ["Finalizada", "finalizada"],
                ["Cancelada", "cancelada"],
                ["Com ocorrência", "com_ocorrencia"],
              ].map(([label, key]) => (
                <div key={key} className="flex justify-between rounded-md border p-2">
                  <span>{label}</span>
                  <span className="font-semibold">{viagensPorStatus(key)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between rounded-md border p-2">
              <span>CNHs vencendo em 30 dias</span>
              <span className="font-semibold">{cnhVencendo.length}</span>
            </div>
            <div className="flex justify-between rounded-md border p-2">
              <span>Documentos de veículo vencendo</span>
              <span className="font-semibold">{docsVeiculoVencendo.length}</span>
            </div>
            <div className="flex justify-between rounded-md border p-2">
              <span>Motoristas bloqueados</span>
              <span className="font-semibold">
                {motoristas.filter((m) => m.status === "bloqueado").length}
              </span>
            </div>
            <div className="flex justify-between rounded-md border p-2">
              <span>Pneus com sulco ≤ 3 mm</span>
              <span className="font-semibold">{pneusSulcoBaixo}</span>
            </div>
            <div className="flex justify-between rounded-md border p-2">
              <span>Veículos em manutenção</span>
              <span className="font-semibold">
                {veiculos.filter((v) => v.status === "em_manutencao").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  money,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  money?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{money ? formatCurrency(value) : value}</p>
          </div>
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
