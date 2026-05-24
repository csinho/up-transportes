import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Sessão Supabase ativa (ERP e-mail/senha ou motorista anônimo). */
export async function requireSupabaseSession(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

/** @deprecated Use requireSupabaseSession */
export async function shouldUseSupabaseStore(): Promise<boolean> {
  return requireSupabaseSession();
}
