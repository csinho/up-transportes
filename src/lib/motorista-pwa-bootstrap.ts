import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";
import { syncMotoristaOfflineAuthToServiceWorker } from "@/lib/motorista-sw-cache";
import { runMotoristaOfflineSetup } from "@/lib/motorista-offline-setup";
import { isMotoristaOnline } from "@/lib/motorista-online";

/** Ao abrir o PWA autenticado: sessão no SW, cache local e preparo offline completo. */
export async function bootstrapMotoristaPwaOffline(qc: QueryClient): Promise<boolean> {
  const session = getMotoristaSession();
  if (!session) {
    await syncMotoristaOfflineAuthToServiceWorker(false);
    return false;
  }

  await syncMotoristaOfflineAuthToServiceWorker(true);

  if (!isMotoristaOnline()) {
    await loadMotoristaCacheIntoQueries(qc, session.transportadoraId);
  }

  if (isMotoristaOnline()) {
    void runMotoristaOfflineSetup(qc);
  }

  return true;
}
