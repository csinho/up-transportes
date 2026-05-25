import { useActiveTenantId } from "@/data/store";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import type { UUID } from "@/types";

/** Tenant ativo no PWA — prioriza sessão do motorista (evita tenant vazio offline). */
export function useMotoristaTenantId(): UUID {
  const stored = useActiveTenantId();
  const { session } = useMotoristaSession();
  return session?.transportadoraId ?? stored;
}
