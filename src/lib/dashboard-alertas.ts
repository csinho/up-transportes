import { differenceInHours, isPast, parseISO } from "date-fns";
import type { Viagem, ViagemOcorrencia } from "@/types";

/** Horas parado em status "parada" antes de gerar alerta. */
export const HORAS_PARADA_ALERTA = 2;

const STATUS_FINAL = new Set(["finalizada", "cancelada"]);

const STATUS_ATIVOS = new Set([
  "aguardando_carregamento",
  "em_carregamento",
  "em_transito",
  "parada",
  "em_descarga",
  "com_ocorrencia",
  "planejada",
]);

export type SeveridadeAlerta = "critica" | "alta" | "media";

export type AlertaOperacional = {
  id: string;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  viagemId: string;
  numeroViagem: number;
};

export function viagemEstaAtrasada(v: Viagem): boolean {
  if (!v.data_prevista_chegada || STATUS_FINAL.has(v.status)) return false;
  try {
    return isPast(parseISO(v.data_prevista_chegada));
  } catch {
    return false;
  }
}

export function viagemParadaHaHoras(v: Viagem, horas = HORAS_PARADA_ALERTA): boolean {
  if (v.status !== "parada" || STATUS_FINAL.has(v.status)) return false;
  try {
    return differenceInHours(new Date(), parseISO(v.updated_at)) >= horas;
  } catch {
    return false;
  }
}

export function ocorrenciaEhCritica(oc: ViagemOcorrencia): boolean {
  return (
    oc.status === "aberta" &&
    (oc.gravidade === "critica" || oc.gravidade === "alta")
  );
}

export function calcularAlertasOperacionais(
  viagens: Viagem[],
  ocorrencias: ViagemOcorrencia[],
): AlertaOperacional[] {
  const alertas: AlertaOperacional[] = [];
  const viagemPorId = new Map(viagens.map((v) => [v.id, v]));

  for (const v of viagens) {
    if (!STATUS_ATIVOS.has(v.status) || STATUS_FINAL.has(v.status)) continue;

    if (viagemEstaAtrasada(v)) {
      alertas.push({
        id: `atraso-${v.id}`,
        severidade: "alta",
        titulo: "Viagem atrasada",
        descricao: `#${String(v.numero_viagem).padStart(5, "0")} — chegada prevista já passou.`,
        viagemId: v.id,
        numeroViagem: v.numero_viagem,
      });
    }

    if (viagemParadaHaHoras(v)) {
      const horas = differenceInHours(new Date(), parseISO(v.updated_at));
      alertas.push({
        id: `parada-${v.id}`,
        severidade: horas >= HORAS_PARADA_ALERTA * 2 ? "alta" : "media",
        titulo: "Viagem parada há muito tempo",
        descricao: `#${String(v.numero_viagem).padStart(5, "0")} — parada há ${horas}h.`,
        viagemId: v.id,
        numeroViagem: v.numero_viagem,
      });
    }

    if (v.status === "com_ocorrencia") {
      alertas.push({
        id: `status-oc-${v.id}`,
        severidade: "media",
        titulo: "Viagem com ocorrência ativa",
        descricao: `#${String(v.numero_viagem).padStart(5, "0")} — aguardando tratamento.`,
        viagemId: v.id,
        numeroViagem: v.numero_viagem,
      });
    }
  }

  for (const oc of ocorrencias) {
    if (!ocorrenciaEhCritica(oc)) continue;
    const v = viagemPorId.get(oc.viagem_id);
    if (!v || STATUS_FINAL.has(v.status)) continue;

    alertas.push({
      id: `oc-${oc.id}`,
      severidade: oc.gravidade === "critica" ? "critica" : "alta",
      titulo: `Ocorrência ${oc.gravidade === "critica" ? "crítica" : "alta"}`,
      descricao: `#${String(v.numero_viagem).padStart(5, "0")} — ${oc.titulo}`,
      viagemId: v.id,
      numeroViagem: v.numero_viagem,
    });
  }

  const ordem: Record<SeveridadeAlerta, number> = { critica: 0, alta: 1, media: 2 };
  return alertas.sort(
    (a, b) => ordem[a.severidade] - ordem[b.severidade] || a.numeroViagem - b.numeroViagem,
  );
}
