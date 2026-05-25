import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";
import { syncMotoristaOfflineAuthToServiceWorker } from "@/lib/motorista-sw-cache";
import { prefetchMotoristaOfflineChunks } from "@/lib/motorista-chunk-prefetch";
import { isMotoristaOnline } from "@/lib/motorista-online";

/** Ao abrir o PWA: marca login no SW, hidrata IndexedDB e pré-baixa chunks das rotas. */
export async function bootstrapMotoristaPwaOffline(qc: QueryClient): Promise<boolean> {
  const session = getMotoristaSession();
  if (!session) {
    await syncMotoristaOfflineAuthToServiceWorker(false);
    return false;
  }

  await syncMotoristaOfflineAuthToServiceWorker(true);
  await loadMotoristaCacheIntoQueries(qc, session.transportadoraId);

  if (isMotoristaOnline()) {
    void prefetchMotoristaOfflineChunks();
  }

  return true;
}
