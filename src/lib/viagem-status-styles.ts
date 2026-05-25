import type { StatusViagem } from "@/types";
import { STATUS_VIAGEM } from "@/types";

export type ViagemStatusStyle = {
  label: string;
  /** Classes do badge/tag de status */
  badge: string;
  /** Fundo e borda do card destacado */
  card: string;
  /** Barra lateral (lista / cards) */
  accent: string;
};

export const VIAGEM_STATUS_STYLES: Record<StatusViagem, ViagemStatusStyle> = {
  planejada: {
    label: "Planejada",
    badge:
      "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
    card: "border-slate-300/70 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/50",
    accent: "border-l-slate-500",
  },
  aguardando_carregamento: {
    label: "Aguardando carregamento",
    badge:
      "border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-50",
    card: "border-amber-400/60 bg-amber-50 dark:border-amber-600/50 dark:bg-amber-950/35",
    accent: "border-l-amber-500",
  },
  em_carregamento: {
    label: "Em carregamento",
    badge:
      "border-orange-400 bg-orange-100 text-orange-950 dark:border-orange-600 dark:bg-orange-950/60 dark:text-orange-50",
    card: "border-orange-400/60 bg-orange-50 dark:border-orange-600/50 dark:bg-orange-950/35",
    accent: "border-l-orange-500",
  },
  em_transito: {
    label: "Em trânsito",
    badge:
      "border-blue-400 bg-blue-100 text-blue-950 dark:border-blue-600 dark:bg-blue-950/60 dark:text-blue-50",
    card: "border-blue-400/60 bg-blue-50 dark:border-blue-600/50 dark:bg-blue-950/35",
    accent: "border-l-blue-600",
  },
  parada: {
    label: "Parada",
    badge:
      "border-violet-400 bg-violet-100 text-violet-950 dark:border-violet-600 dark:bg-violet-950/60 dark:text-violet-50",
    card: "border-violet-400/60 bg-violet-50 dark:border-violet-600/50 dark:bg-violet-950/35",
    accent: "border-l-violet-500",
  },
  em_descarga: {
    label: "Em descarga",
    badge:
      "border-cyan-500 bg-cyan-100 text-cyan-950 dark:border-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-50",
    card: "border-cyan-400/60 bg-cyan-50 dark:border-cyan-600/50 dark:bg-cyan-950/35",
    accent: "border-l-cyan-500",
  },
  finalizada: {
    label: "Finalizada",
    badge:
      "border-emerald-500 bg-emerald-100 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-50",
    card: "border-emerald-400/60 bg-emerald-50 dark:border-emerald-600/50 dark:bg-emerald-950/35",
    accent: "border-l-emerald-600",
  },
  cancelada: {
    label: "Cancelada",
    badge:
      "border-red-400 bg-red-100 text-red-950 dark:border-red-700 dark:bg-red-950/60 dark:text-red-50",
    card: "border-red-400/60 bg-red-50 dark:border-red-700/50 dark:bg-red-950/35",
    accent: "border-l-red-600",
  },
  com_ocorrencia: {
    label: "Com ocorrência",
    badge:
      "border-rose-500 bg-rose-100 text-rose-950 dark:border-rose-600 dark:bg-rose-950/60 dark:text-rose-50",
    card: "border-rose-400/60 bg-rose-50 dark:border-rose-600/50 dark:bg-rose-950/35",
    accent: "border-l-rose-600",
  },
};

export function getViagemStatusStyle(status: StatusViagem | string): ViagemStatusStyle {
  const hit = VIAGEM_STATUS_STYLES[status as StatusViagem];
  if (hit) return hit;
  const fallbackLabel =
    STATUS_VIAGEM.find((s) => s.value === status)?.label ?? String(status);
  return {
    label: fallbackLabel,
    badge: VIAGEM_STATUS_STYLES.planejada.badge,
    card: VIAGEM_STATUS_STYLES.planejada.card,
    accent: VIAGEM_STATUS_STYLES.planejada.accent,
  };
}

export function getViagemStatusLabel(status: StatusViagem | string): string {
  return getViagemStatusStyle(status).label;
}
