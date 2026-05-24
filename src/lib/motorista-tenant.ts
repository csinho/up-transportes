import type { UUID } from "@/types";
import { getActiveTransportadoraId, setActiveTransportadoraId } from "@/data/store";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidTransportadoraId(value: string | undefined): value is UUID {
  return !!value && UUID_RE.test(value);
}

/** ID da transportadora para branding no app motorista (URL ?t= ou último tenant ativo). */
export function resolveMotoristaBrandingTenantId(searchTenant?: string): UUID | undefined {
  if (isValidTransportadoraId(searchTenant)) return searchTenant;
  const stored = getActiveTransportadoraId();
  return isValidTransportadoraId(stored) ? stored : undefined;
}

export function persistMotoristaBrandingTenant(id: UUID) {
  setActiveTransportadoraId(id);
}

export function motoristaAppUrl(transportadoraId?: UUID): string {
  if (typeof window === "undefined") {
    return transportadoraId ? `/motorista?t=${transportadoraId}` : "/motorista";
  }
  const base = `${window.location.origin}/motorista`;
  return transportadoraId ? `${base}?t=${transportadoraId}` : base;
}
