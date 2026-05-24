import { useOperacaoRealtime } from "@/hooks/use-operacao-realtime";

/** Assina Supabase Realtime e invalida React Query (ERP + motorista). */
export function OperacaoRealtimeBridge() {
  useOperacaoRealtime();
  return null;
}
