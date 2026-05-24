import type { ColaboradorRole } from "@/lib/supabase/colaboradores";

export type ErpNavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Perfis que podem ver; omitido = owner e operador */
  roles?: ColaboradorRole[];
};

export function canAccessRoute(role: ColaboradorRole | null | undefined, allowed: ColaboradorRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

/** Auditoria e export — só proprietário. */
export function canAccessAuditoria(role: ColaboradorRole | null | undefined): boolean {
  return role === "owner";
}

/** Configuração da transportadora e colaboradores — só proprietário. */
export function canAccessTransportadoraConfig(role: ColaboradorRole | null | undefined): boolean {
  return role === "owner";
}

/** ERP completo (não é cliente por link). */
export function canAccessErp(role: ColaboradorRole | null | undefined): boolean {
  return role === "owner" || role === "operador";
}
