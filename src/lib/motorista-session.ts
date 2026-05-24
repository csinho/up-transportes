import type { UUID } from "@/types";
import { setActiveTransportadoraId } from "@/data/store";

const SESSION_KEY = "erp_transp_motorista_session_v1";

export type MotoristaSession = {
  motoristaId: UUID;
  transportadoraId: UUID;
  nome: string;
  cpf: string;
  loggedAt: string;
};

export function getMotoristaSession(): MotoristaSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MotoristaSession;
  } catch {
    return null;
  }
}

export function setMotoristaSession(session: MotoristaSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setActiveTransportadoraId(session.transportadoraId);
}

export function clearMotoristaSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
