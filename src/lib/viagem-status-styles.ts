import type { StatusViagem } from "@/types";
import { STATUS_VIAGEM } from "@/types";

export type ViagemStatusStyle = {
  label: string;
  badge: string;
  card: string;
  accentRight: string;
  accentLeft: string;
  accent: string;
};

const CARD_NEUTRAL = "bg-card border border-border shadow-card";

export const VIAGEM_STATUS_STYLES: Record<StatusViagem, ViagemStatusStyle> = {
  planejada: {
    label: "Planejada",
    badge: "border-blue-500 bg-blue-50 text-blue-800",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-blue-500",
    accentLeft: "border-l-4 border-l-blue-500",
    accent: "border-l-4 border-l-blue-500",
  },
  aguardando_carregamento: {
    label: "Aguardando carregamento",
    badge: "border-violet-500 bg-violet-50 text-violet-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-violet-500",
    accentLeft: "border-l-4 border-l-violet-500",
    accent: "border-l-4 border-l-violet-500",
  },
  em_carregamento: {
    label: "Em carregamento",
    badge: "border-amber-500 bg-amber-50 text-amber-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-amber-500",
    accentLeft: "border-l-4 border-l-amber-500",
    accent: "border-l-4 border-l-amber-500",
  },
  em_transito: {
    label: "Em trânsito",
    badge: "border-orange-500 bg-orange-50 text-orange-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-orange-500",
    accentLeft: "border-l-4 border-l-orange-500",
    accent: "border-l-4 border-l-orange-500",
  },
  parada: {
    label: "Parada",
    badge: "border-red-400 bg-red-50 text-red-800",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-red-400",
    accentLeft: "border-l-4 border-l-red-400",
    accent: "border-l-4 border-l-red-400",
  },
  aguardando_descarga: {
    label: "Aguardando descarga",
    badge: "border-cyan-600 bg-cyan-50 text-cyan-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-cyan-600",
    accentLeft: "border-l-4 border-l-cyan-600",
    accent: "border-l-4 border-l-cyan-600",
  },
  em_descarga: {
    label: "Em descarga",
    badge: "border-teal-600 bg-teal-50 text-teal-900",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-teal-600",
    accentLeft: "border-l-4 border-l-teal-600",
    accent: "border-l-4 border-l-teal-600",
  },
  finalizada: {
    label: "Finalizada",
    badge: "border-green-500 bg-green-50 text-green-800",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-green-500",
    accentLeft: "border-l-4 border-l-green-500",
    accent: "border-l-4 border-l-green-500",
  },
  cancelada: {
    label: "Cancelada",
    badge: "border-slate-400 bg-slate-100 text-slate-700",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-slate-400",
    accentLeft: "border-l-4 border-l-slate-400",
    accent: "border-l-4 border-l-slate-400",
  },
  com_ocorrencia: {
    label: "Com ocorrência",
    badge: "border-red-500 bg-red-50 text-red-800",
    card: CARD_NEUTRAL,
    accentRight: "border-r-4 border-r-red-500",
    accentLeft: "border-l-4 border-l-red-500",
    accent: "border-l-4 border-l-red-500",
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
