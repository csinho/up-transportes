import { useEffect } from "react";
import { initOfflineQueueCache } from "@/lib/motorista-offline-queue";

/** Inicializa contador da fila offline (IndexedDB). Snapshot só no dashboard. */
export function useMotoristaQueueBootstrap() {
  useEffect(() => {
    void initOfflineQueueCache();
  }, []);
}
