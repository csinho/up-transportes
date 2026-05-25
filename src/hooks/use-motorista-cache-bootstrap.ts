import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { hydrateMotoristaQueries } from "@/lib/motorista-cache-sync";
import { initOfflineQueueCache } from "@/lib/motorista-offline-queue";
import { isMotoristaAppPath } from "@/lib/motorista-data-context";

/** Carrega IndexedDB → React Query e atualiza snapshot quando online. */
export function useMotoristaCacheBootstrap() {
  const qc = useQueryClient();
  const { session } = useMotoristaSession();

  useEffect(() => {
    void initOfflineQueueCache();
  }, []);

  useEffect(() => {
    if (!session || !isMotoristaAppPath()) return;
    void hydrateMotoristaQueries(qc, session.transportadoraId, session.motoristaId);
  }, [qc, session?.transportadoraId, session?.motoristaId]);
}
