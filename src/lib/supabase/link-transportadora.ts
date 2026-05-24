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

  const { error } = await supabase.rpc("link_my_transportadora", {
    tid: DEMO_TRANSPORTADORA_ID,
    p_role: "owner",
  });

  if (error) {
    console.warn("[Supabase] Falha ao vincular transportadora:", traduzirErroSupabase(error));
    return;
  }

  if (!getActiveTransportadoraId()) {
    setActiveTransportadoraId(DEMO_TRANSPORTADORA_ID);
  }
}
