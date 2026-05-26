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

/** Resolve tenant ativo no ERP (ignora valores inválidos no localStorage). */
export function resolveErpMotoristaTenantId(...candidates: (string | undefined)[]): UUID | undefined {
  for (const candidate of candidates) {
    if (isValidTransportadoraId(candidate)) return candidate;
  }
  const stored = getActiveTransportadoraId();
  return isValidTransportadoraId(stored) ? stored : undefined;
}

/** URL absoluta do PWA motorista (sempre com origin + path + ?t=uuid). */
export function buildMotoristaAppAbsoluteUrl(transportadoraId?: UUID): string {
  const path = transportadoraId
    ? `/motorista?t=${encodeURIComponent(transportadoraId)}`
    : "/motorista";

  if (typeof window === "undefined") return path;

  const origin = window.location.origin;
  if (!origin || origin === "null") return path;

  return `${origin}${path}`;
}

export function motoristaAppUrl(transportadoraId?: UUID): string {
  return buildMotoristaAppAbsoluteUrl(transportadoraId);
}
