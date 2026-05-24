import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UUID } from "@/types";
import {
  criarAcessoClienteViagem,
  revogarAcessoCliente,
  listAcessosClienteViagem,
  fetchAcompanhamentoCliente,
} from "@/lib/viagem-acesso-cliente";

const RECONNECT_MS = 5_000;

export function useAcessosClienteViagem(viagemId: UUID | undefined) {
  return useQuery({
    queryKey: ["viagem-acessos-cliente", viagemId],
    enabled: !!viagemId,
    queryFn: () => listAcessosClienteViagem(viagemId!),
  });
}

export function useCriarAcessoCliente(viagemId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (titulo?: string) => criarAcessoClienteViagem(viagemId, titulo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["viagem-acessos-cliente", viagemId] }),
  });
}

export function useRevogarAcessoCliente(viagemId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: UUID) => revogarAcessoCliente(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["viagem-acessos-cliente", viagemId] }),
  });
}

export function useAcompanhamentoCliente(token: string) {
  return useQuery({
    queryKey: ["acompanhamento-cliente", token],
    queryFn: () => fetchAcompanhamentoCliente(token),
    staleTime: 30_000,
    retry: 1,
  });
}

/** Realtime no portal /acompanhar — invalida dados quando viagem ou localização muda. */
export function useAcompanhamentoClienteRealtime(token: string, viagemId: UUID | undefined) {
  const qc = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || !viagemId || !isSupabaseConfigured()) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    const invalidate = () => {
      void qc.invalidateQueries({ queryKey: ["acompanhamento-cliente", token] });
    };

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

      const channel = supabase
        .channel(`acompanhamento:${viagemId}:${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "viagens", filter: `id=eq.${viagemId}` },
          invalidate,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "viagem_localizacoes",
            filter: `viagem_id=eq.${viagemId}`,
          },
          invalidate,
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            invalidate();
            return;
          }
          if (status === "CHANNEL_ERROR") {
            console.error("[Realtime cliente] Erro no canal:", err);
            clearReconnect();
            reconnectTimerRef.current = setTimeout(() => {
              if (!cancelled) subscribe();
            }, RECONNECT_MS);
          }
          if (status === "TIMED_OUT" || status === "CLOSED") {
            clearReconnect();
            reconnectTimerRef.current = setTimeout(() => {
              if (!cancelled) subscribe();
            }, RECONNECT_MS);
          }
        });

      channelRef.current = channel;
    };

    subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    const onOnline = () => {
      subscribe();
      invalidate();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      teardown();
    };
  }, [token, viagemId, qc]);
}
