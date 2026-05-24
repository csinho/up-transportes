import { useEffect } from "react";
import { useActiveTenantId, setActiveTransportadoraId, useTransportadoras } from "@/data/store";
import { useUserTenantRole } from "@/hooks/use-colaboradores";
import {
  canAccessAuditoria,
  canAccessErp,
  canAccessTransportadoraConfig,
} from "@/lib/erp-permissions";
import type { ColaboradorRole } from "@/lib/supabase/colaboradores";

export function useErpPermissions() {
  const tenantId = useActiveTenantId();
  const { data: transportadoras = [], isLoading: tenantsLoading } = useTransportadoras();
  const effectiveTenantId = tenantId || transportadoras[0]?.id;
  const { data: role, isLoading: roleLoading } = useUserTenantRole(effectiveTenantId);

  useEffect(() => {
    if (!tenantId && transportadoras[0]?.id) {
      setActiveTransportadoraId(transportadoras[0].id);
    }
  }, [tenantId, transportadoras]);

  return {
    role: role ?? null,
    loading: tenantsLoading || (!!effectiveTenantId && roleLoading),
    isOwner: role === "owner",
    isOperador: role === "operador",
    canAccessErp: canAccessErp(role),
    canAccessAuditoria: canAccessAuditoria(role),
    canAccessTransportadoraConfig: canAccessTransportadoraConfig(role),
  };
}

export type { ColaboradorRole };
