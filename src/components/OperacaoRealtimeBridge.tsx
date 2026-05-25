import { useOperacaoRealtime } from "@/hooks/use-operacao-realtime";

/** Assina Supabase Realtime e invalida React Query (somente ERP). */
export function OperacaoRealtimeBridge() {
  useOperacaoRealtime();
  return null;
}
