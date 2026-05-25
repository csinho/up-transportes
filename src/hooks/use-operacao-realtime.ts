import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useActiveTenantId } from "@/data/store";
import { useAuthSession } from "@/hooks/use-auth-session";
import { isMotoristaAppPath } from "@/lib/motorista-app-path";

const REALTIME_TABLES = [
  "viagens",
  "viagem_eventos",
  "viagem_ocorrencias",
  "viagem_localizacoes",
] as const;

const RECONNECT_MS = 5_000;

export function invalidateOperacaoQueries(qc: ReturnType<typeof useQueryClient>) {
  const opts = { refetchType: "active" as const };
  void qc.invalidateQueries({ queryKey: ["viagens"], ...opts });
  void qc.invalidateQueries({ queryKey: ["viagem_eventos"], ...opts });
  void qc.invalidateQueries({ queryKey: ["viagem_ocorrencias"], ...opts });
  void qc.invalidateQueries({ queryKey: ["viagem_localizacoes"], ...opts });
  void qc.invalidateQueries({ queryKey: ["motoristas"], ...opts });
  void qc.invalidateQueries({ queryKey: ["veiculos"], ...opts });
}

function attachOperacaoChannel(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  tenant: string,
  userId: string,
  qc: ReturnType<typeof useQueryClient>,
  onResubscribe: () => void,
): RealtimeChannel {
  let channel = supabase.channel(`operacao:${tenant}:${userId}:${Date.now()}`);

  for (const table of REALTIME_TABLES) {
    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `transportadora_id=eq.${tenant}`,
      },
      () => invalidateOperacaoQueries(qc),
    );
  }

  channel.subscribe((status, err) => {
    if (status === "SUBSCRIBED") {
      return;
    }
    if (status === "CHANNEL_ERROR") {
      console.error("[Realtime] Erro no canal:", err);
      onResubscribe();
    }
    if (status === "TIMED_OUT" || status === "CLOSED") {
      if (document.visibilityState === "visible") {
        onResubscribe();
      }
    }
  });

  return channel;
}

/**
 * Supabase Realtime — invalida React Query quando operação muda no banco.
 * Reconecta ao perder conexão; não refaz fetch ao apenas trocar de aba do navegador.
 */
export function useOperacaoRealtime() {
  const qc = useQueryClient();
  const tenant = useActiveTenantId();
  const { session, loading } = useAuthSession();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      isMotoristaAppPath(window.location.pathname)
    ) {
      return;
    }
    if (!isSupabaseConfigured() || !tenant || loading || !session) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const teardown = () => {
      clearReconnect();
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const subscribe = () => {
      if (cancelled) return;
      teardown();
      channelRef.current = attachOperacaoChannel(
        supabase,
        tenant,
        session.user.id,
        qc,
        () => {
          clearReconnect();
          reconnectTimerRef.current = setTimeout(() => {
            if (!cancelled) subscribe();
          }, RECONNECT_MS);
        },
      );
    };

    subscribe();

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled || !nextSession) return;
      subscribe();
    });

    const onOnline = () => {
      subscribe();
    };

    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      authSub.unsubscribe();
      window.removeEventListener("online", onOnline);
      teardown();
    };
  }, [qc, tenant, session?.user.id, loading]);
}
