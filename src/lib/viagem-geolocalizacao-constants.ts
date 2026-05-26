import type { Viagem } from "@/types";

/** Intervalo alvo entre envios ao servidor (ms). */
export const GPS_INTERVALO_MS = 30_000;

export const STATUS_COM_RASTREAMENTO_GPS = new Set<Viagem["status"]>([
  "em_carregamento",
  "em_transito",
  "parada",
  "em_descarga",
  "com_ocorrencia",
]);

const PRIORIDADE_STATUS: Partial<Record<Viagem["status"], number>> = {
  em_transito: 50,
  em_descarga: 40,
  parada: 30,
  em_carregamento: 20,
  com_ocorrencia: 10,
};

export function isStatusComRastreamentoGps(status: Viagem["status"]): boolean {
  return STATUS_COM_RASTREAMENTO_GPS.has(status);
}

/** Viagem do motorista que deve receber pings GPS periódicos. */
export function escolherViagemParaRastreamentoGps(
  viagens: Viagem[],
  motoristaId: string,
): Viagem | undefined {
  const candidatas = viagens.filter(
    (v) => v.motorista_id === motoristaId && isStatusComRastreamentoGps(v.status),
  );
  if (candidatas.length === 0) return undefined;

  return candidatas.sort((a, b) => {
    const pa = PRIORIDADE_STATUS[a.status] ?? 0;
    const pb = PRIORIDADE_STATUS[b.status] ?? 0;
    if (pb !== pa) return pb - pa;
    return b.numero_viagem - a.numero_viagem;
  })[0];
}
