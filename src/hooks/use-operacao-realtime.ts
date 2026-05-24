import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useActiveTenantId } from "@/data/store";
import { useAuthSession } from "@/hooks/use-auth-session";

const REALTIME_TABLES = [
  "viagens",
  "viagem_eventos",
  "viagem_ocorrencias",
  "viagem_localizacoes",
] as const;

function invalidateOperacao(qc: ReturnType<typeof useQueryClient>) {
  const opts = { refetchType: "active" as const };
  void qc.invalidateQueries({ queryKey: ["viagens"], ...opts });
  void qc.invalidateQueries({ queryKey: ["viagem_eventos"], ...opts });
  void qc.invalidateQueries({ queryKey: ["viagem_ocorrencias"], ...opts });
  void qc.invalidateQueries({ queryKey: ["viagem_localizacoes"], ...opts });
  void qc.invalidateQueries({ queryKey: ["motoristas"], ...opts });
  void qc.invalidateQueries({ queryKey: ["veiculos"], ...opts });
}

function attachOperacaoListeners(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  tenant: string,
  userId: string,
  qc: ReturnType<typeof useQueryClient>,
): RealtimeChannel {
  let channel = supabase.channel(`operacao:${tenant}:${userId}`);

  for (const table of REALTIME_TABLES) {
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => invalidateOperacao(qc),
    );
  }

  channel.subscribe((status, err) => {
    if (status === "SUBSCRIBED") {
      console.debug("[Realtime] Canal operação conectado.");
      return;
    }
    if (status === "CHANNEL_ERROR") {
      console.error("[Realtime] Erro no canal operação:", err);
    }
    if (status === "TIMED_OUT") {
      console.warn("[Realtime] Canal operação expirou.");
    }
  });

  return channel;
}

/**
 * Supabase Realtime — invalida React Query quando viagens/eventos/ocorrências/localizações mudam.
 * Aguarda sessão autenticada (ERP ou motorista anônimo) e reconecta ao renovar o token.
 */
export function useOperacaoRealtime() {
  const qc = useQueryClient();
  const tenant = useActiveTenantId();
  const { session, loading } = useAuthSession();

  useEffect(() => {
    if (!isSupabaseConfigured() || !tenant || loading || !session) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    let channel = attachOperacaoListeners(supabase, tenant, session.user.id, qc);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void supabase.removeChannel(channel);
      if (nextSession) {
        channel = attachOperacaoListeners(supabase, tenant, nextSession.user.id, qc);
      }
    });

    return () => {
      subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [qc, tenant, session?.user.id, loading]);
}
