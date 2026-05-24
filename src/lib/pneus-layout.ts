import type { PosicaoPneu, Pneu, Veiculo } from "@/types";
import { layoutVisualVeiculo, posicoesAtivasVeiculo } from "@/lib/veiculo-pneus-perfil";

export function posicoesAtivas(veiculo: Pick<Veiculo, "tipo_veiculo" | "numero_eixos">): PosicaoPneu[] {
  return posicoesAtivasVeiculo(veiculo);
}

export function pneusPorPosicao(pneus: Pneu[]): Partial<Record<PosicaoPneu, Pneu>> {
  return Object.fromEntries(pneus.filter((p) => p.posicao).map((p) => [p.posicao!, p]));
}

export { layoutVisualVeiculo };
