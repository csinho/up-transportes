import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";
import { syncMotoristaOfflineAuthToServiceWorker } from "@/lib/motorista-sw-cache";

/** Ao abrir o PWA: marca login no SW e hidrata IndexedDB na UI. */
export async function bootstrapMotoristaPwaOffline(qc: QueryClient): Promise<boolean> {
  const session = getMotoristaSession();
  if (!session) {
    await syncMotoristaOfflineAuthToServiceWorker(false);
    return false;
  }

  await syncMotoristaOfflineAuthToServiceWorker(true);
  await loadMotoristaCacheIntoQueries(qc, session.transportadoraId);
  return true;
}
