import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { ErpLoginPage } from "@/components/auth/ErpLoginPage";
import { useAuthSession } from "@/hooks/use-auth-session";
import {
  applyLoginTenantPreference,
  ensureDemoTenantLink,
} from "@/lib/supabase/link-transportadora";
import {
  isValidTransportadoraId,
  persistMotoristaBrandingTenant,
  resolveMotoristaBrandingTenantId,
} from "@/lib/motorista-tenant";

const loginSearchSchema = z.object({
  redirect: z.string().optional().default("/"),
  t: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Entrar — ERP Transportadora" }],
  }),
  component: Page,
});

function Page() {
  const { redirect, t } = Route.useSearch();
  const { loading, session } = useAuthSession();
  const navigate = useNavigate();
  const transportadoraId = resolveMotoristaBrandingTenantId(t);

  useEffect(() => {
    if (isValidTransportadoraId(t)) persistMotoristaBrandingTenant(t);
  }, [t]);

  useEffect(() => {
    if (loading || !session) return;
    void (async () => {
      await ensureDemoTenantLink();
      if (isValidTransportadoraId(t)) {
        await applyLoginTenantPreference(t);
      }
      void navigate({ to: redirect, replace: true });
    })();
  }, [loading, session, redirect, navigate, t]);

  const handleSuccess = () => {
    void (async () => {
      await ensureDemoTenantLink();
      if (isValidTransportadoraId(t)) {
        await applyLoginTenantPreference(t);
      }
      void navigate({ to: redirect, replace: true });
    })();
  };

  return (
    <ErpLoginPage
      transportadoraId={transportadoraId}
      redirectTo={redirect}
      onSuccess={handleSuccess}
    />
  );
}
