import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { getActiveTransportadoraId, setActiveTransportadoraId } from "@/data/store";

/** ID da transportadora inicial criada pela migration (bootstrap do ERP). */
export const DEMO_TRANSPORTADORA_ID = "a1000001-0001-4001-8001-000000000001";

/** Vincula usuário logado à transportadora demo se ainda não tiver tenant. */
export async function ensureDemoTenantLink(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { aceitarConvitesPendentes } = await import("@/lib/supabase/colaboradores");
  await aceitarConvitesPendentes();

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (isAdmin) {
    const { data: tenants } = await supabase
      .from("user_transportadoras")
      .select("transportadora_id")
      .limit(1);
    if (tenants && tenants.length > 0) {
      if (!getActiveTransportadoraId()) {
        setActiveTransportadoraId(tenants[0].transportadora_id);
      }
      return;
    }
    return;
  }

  const { data: existing, error: readErr } = await supabase
    .from("user_transportadoras")
    .select("transportadora_id")
    .limit(1);

  if (readErr) {
    console.warn("[Supabase] Falha ao ler vínculos:", traduzirErroSupabase(readErr));
    return;
  }

  if (existing && existing.length > 0) {
    if (!getActiveTransportadoraId()) {
      setActiveTransportadoraId(existing[0].transportadora_id);
    }
    return;
  }

  // Em produção não auto-vincula à transportadora demo (evita lista de "proprietários" fantasma).
  if (!import.meta.env.DEV) return;

  const { error } = await supabase.rpc("link_my_transportadora", {
    tid: DEMO_TRANSPORTADORA_ID,
    p_role: "operador",
  });

  if (error) {
    console.warn("[Supabase] Falha ao vincular transportadora:", traduzirErroSupabase(error));
    return;
  }

  if (!getActiveTransportadoraId()) {
    setActiveTransportadoraId(DEMO_TRANSPORTADORA_ID);
  }
}

/** Define tenant ativo após login se informado na URL e usuário tem acesso. */
export async function applyLoginTenantPreference(tenantId?: string): Promise<void> {
  if (!tenantId || !isSupabaseConfigured()) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data, error } = await supabase
    .from("user_transportadoras")
    .select("transportadora_id")
    .eq("transportadora_id", tenantId)
    .maybeSingle();

  if (!error && data) {
    setActiveTransportadoraId(tenantId);
  }
}
