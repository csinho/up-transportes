import type { StatusViagem } from "@/types";
import { STATUS_VIAGEM } from "@/types";

export type ViagemStatusStyle = {
  label: string;
  /** Tag colorida (fundo claro + texto escuro) */
  badge: string;
  /** Card neutro — sem tinta no fundo */
  card: string;
  /** Barra ~4px na borda direita (PWA motorista) */
  accentRight: string;
  /** Barra ~4px na borda esquerda (ERP dashboard) */
  accentLeft: string;
  /** @deprecated Use accentLeft — compatibilidade */
  accent: string;
};

const CARD_NEUTRAL = "bg-card border border-border shadow-sm";

export const VIAGEM_STATUS_STYLES: Record<StatusViagem, ViagemStatusStyle> = {
  planejada: {
    label: "Planejada",
    badge:
      "border-indigo-500 bg-indigo-100 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-100 dark:text-indigo-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-indigo-500",
    accentLeft: "border-l-4 border-l-indigo-500",
    accent: "border-l-4 border-l-indigo-500",
  },
  aguardando_carregamento: {
    label: "Aguardando carregamento",
    badge:
      "border-yellow-500 bg-yellow-100 text-yellow-900 dark:border-yellow-500 dark:bg-yellow-100 dark:text-yellow-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-yellow-500",
    accentLeft: "border-l-4 border-l-yellow-500",
    accent: "border-l-4 border-l-yellow-500",
  },
  em_carregamento: {
    label: "Em carregamento",
    badge:
      "border-orange-500 bg-orange-100 text-orange-900 dark:border-orange-500 dark:bg-orange-100 dark:text-orange-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-orange-500",
    accentLeft: "border-l-4 border-l-orange-500",
    accent: "border-l-4 border-l-orange-500",
  },
  em_transito: {
    label: "Em trânsito",
    badge:
      "border-blue-600 bg-blue-100 text-blue-900 dark:border-blue-600 dark:bg-blue-100 dark:text-blue-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-blue-600",
    accentLeft: "border-l-4 border-l-blue-600",
    accent: "border-l-4 border-l-blue-600",
  },
  parada: {
    label: "Parada",
    badge:
      "border-purple-500 bg-purple-100 text-purple-900 dark:border-purple-500 dark:bg-purple-100 dark:text-purple-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-purple-500",
    accentLeft: "border-l-4 border-l-purple-500",
    accent: "border-l-4 border-l-purple-500",
  },
  em_descarga: {
    label: "Em descarga",
    badge:
      "border-cyan-500 bg-cyan-100 text-cyan-900 dark:border-cyan-500 dark:bg-cyan-100 dark:text-cyan-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-cyan-500",
    accentLeft: "border-l-4 border-l-cyan-500",
    accent: "border-l-4 border-l-cyan-500",
  },
  finalizada: {
    label: "Finalizada",
    badge:
      "border-green-500 bg-green-100 text-green-900 dark:border-green-500 dark:bg-green-100 dark:text-green-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-green-500",
    accentLeft: "border-l-4 border-l-green-500",
    accent: "border-l-4 border-l-green-500",
  },
  cancelada: {
    label: "Cancelada",
    badge:
      "border-red-500 bg-red-100 text-red-900 dark:border-red-500 dark:bg-red-100 dark:text-red-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-red-500",
    accentLeft: "border-l-4 border-l-red-500",
    accent: "border-l-4 border-l-red-500",
  },
  com_ocorrencia: {
    label: "Com ocorrência",
    badge:
      "border-pink-500 bg-pink-100 text-pink-900 dark:border-pink-500 dark:bg-pink-100 dark:text-pink-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-pink-500",
    accentLeft: "border-l-4 border-l-pink-500",
    accent: "border-l-4 border-l-pink-500",
  },
};

export function getViagemStatusStyle(status: StatusViagem | string): ViagemStatusStyle {
  const hit = VIAGEM_STATUS_STYLES[status as StatusViagem];
  if (hit) return hit;
  const fallbackLabel =
    STATUS_VIAGEM.find((s) => s.value === status)?.label ?? String(status);
  const fb = VIAGEM_STATUS_STYLES.planejada;
  return {
    label: fallbackLabel,
    badge: fb.badge,
    card: fb.card,
    accentRight: fb.accentRight,
    accentLeft: fb.accentLeft,
    accent: fb.accentLeft,
  };
}

export function getViagemStatusLabel(status: StatusViagem | string): string {
  return getViagemStatusStyle(status).label;
}
