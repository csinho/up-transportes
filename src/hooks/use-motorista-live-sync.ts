import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getMotoristaSession } from "@/lib/motorista-session";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { isMotoristaAppPath } from "@/lib/motorista-app-path";
import { ensureMotoristaAnonymousSession } from "@/lib/supabase/motorista-auth";
import { refreshMotoristaDataFromNetwork } from "@/lib/motorista-offline-setup";

const REALTIME_TABLES = [
  "viagens",
  "viagem_eventos",
  "viagem_ocorrencias",
  "viagem_localizacoes",
] as const;

const RECONNECT_MS = 5_000;
const REFRESH_DEBOUNCE_MS = 600;

/**
 * Com internet: Supabase Realtime + refresh ao voltar ao app.
 * Atualiza tela e IndexedDB quando o ERP cria/altera viagens do motorista.
 */
export function useMotoristaLiveSync() {
  const qc = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !isMotoristaAppPath(window.location.pathname)) {
      return;
    }

    const session = getMotoristaSession();
    if (!session || !isSupabaseConfigured()) return;

    const { transportadoraId, motoristaId } = session;
    let cancelled = false;

    const scheduleRefresh = () => {
      if (!isMotoristaOnline()) return;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        if (!cancelled) void refreshMotoristaDataFromNetwork(qc);
      }, REFRESH_DEBOUNCE_MS);
    };

    const clearReconnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const teardown = () => {
      clearReconnect();
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const subscribe = async () => {
      if (cancelled || !isMotoristaOnline()) return;
      teardown();

      await ensureMotoristaAnonymousSession();

      let channel = supabase.channel(
        `motorista-live:${transportadoraId}:${motoristaId}:${Date.now()}`,
      );

      for (const table of REALTIME_TABLES) {
        channel = channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `transportadora_id=eq.${transportadoraId}`,
          },
          () => scheduleRefresh(),
        );
      }

      channel.subscribe((status, err) => {
        if (status === "CHANNEL_ERROR") {
          console.error("[motorista-live] Realtime:", err);
          clearReconnect();
          reconnectTimerRef.current = setTimeout(() => {
            if (!cancelled) void subscribe();
          }, RECONNECT_MS);
        }
        if (status === "TIMED_OUT" || status === "CLOSED") {
          if (document.visibilityState === "visible" && isMotoristaOnline()) {
            clearReconnect();
            reconnectTimerRef.current = setTimeout(() => {
              if (!cancelled) void subscribe();
            }, RECONNECT_MS);
          }
        }
      });

      channelRef.current = channel;
    };

    void (async () => {
      if (isMotoristaOnline()) {
        await refreshMotoristaDataFromNetwork(qc);
        await subscribe();
      }
    })();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!isMotoristaOnline()) return;
      void subscribe();
      scheduleRefresh();
    };

    const onOnline = () => {
      void subscribe();
      scheduleRefresh();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      teardown();
    };
  }, [qc]);
}
