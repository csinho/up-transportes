import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";
import type { UUID } from "@/types";

export type MotoristaAuthResult = {
  motoristaId: UUID;
  transportadoraId: UUID;
  nome: string;
};

type LinkMotoristaRow = {
  motorista_id: UUID;
  transportadora_id: UUID;
  nome: string;
};

/** Sessão anônima mínima para ler branding/logo antes do login por CPF. */
export async function ensureMotoristaAnonymousSession(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) lancarErroSupabase(error);
  }
}

/** Login PWA: sessão anônima Supabase + vínculo por CPF (RPC). */
export async function loginMotoristaPorCpf(cpf: string): Promise<MotoristaAuthResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado.");
  }

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado.");

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const { error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr) lancarErroSupabase(anonErr);
  }

  const { data, error } = await supabase.rpc("link_my_motorista", { p_cpf: cpf });
  if (error) lancarErroSupabase(error);

  const row = (data as LinkMotoristaRow[] | null)?.[0];
  if (!row) throw new Error("CPF não encontrado. Verifique o número ou fale com a transportadora.");

  return {
    motoristaId: row.motorista_id,
    transportadoraId: row.transportadora_id,
    nome: row.nome,
  };
}

/** Encerra sessão anônima do motorista sem afetar login ERP (e-mail). */
export async function logoutMotoristaSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (user?.is_anonymous) {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn("[Supabase] Falha ao sair (motorista):", error.message);
  }
}
