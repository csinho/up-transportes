import type { StatusViagem, Viagem } from "@/types";

/** Viagens visíveis no rastreamento (exclui apenas finalizadas e canceladas). */
export function isViagemRastreavel(status: StatusViagem): boolean {
  return status !== "finalizada" && status !== "cancelada";
}

export function filtrarViagensRastreaveis(viagens: Viagem[]): Viagem[] {
  return viagens
    .filter((v) => isViagemRastreavel(v.status))
    .sort((a, b) => b.numero_viagem - a.numero_viagem);
}
