import type { Viagem } from "@/types";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { getViagemStatusLabel } from "@/lib/viagem-status-styles";

export type ViagemAtivaDoCliente = {
  id: string;
  numero_viagem: number;
  status: string;
  statusLabel: string;
  papel: "origem" | "destino";
};

export function viagensAtivasDoCliente(clienteId: string, viagens: Viagem[]): ViagemAtivaDoCliente[] {
  const result: ViagemAtivaDoCliente[] = [];

  for (const v of viagens) {
    if (!isViagemAtiva(v.status)) continue;
    if (v.cliente_origem_id === clienteId) {
      result.push({
        id: v.id,
        numero_viagem: v.numero_viagem,
        status: v.status,
        statusLabel: getViagemStatusLabel(v.status),
        papel: "origem",
      });
    } else if (v.cliente_destino_id === clienteId) {
      result.push({
        id: v.id,
        numero_viagem: v.numero_viagem,
        status: v.status,
        statusLabel: getViagemStatusLabel(v.status),
        papel: "destino",
      });
    }
  }

  return result.sort((a, b) => b.numero_viagem - a.numero_viagem);
}
