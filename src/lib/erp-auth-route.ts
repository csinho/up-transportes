import { redirect } from "@tanstack/react-router";
import { getActiveTransportadoraId } from "@/data/store";
import { getUserTenantRole, type ColaboradorRole } from "@/lib/supabase/colaboradores";

export async function requireErpRoles(...allowed: ColaboradorRole[]) {
  const tenantId = getActiveTransportadoraId();
  if (!tenantId) {
    throw redirect({ to: "/login" });
  }

  const role = await getUserTenantRole(tenantId);
  if (!role || !allowed.includes(role)) {
    throw redirect({ to: "/" });
  }
}
