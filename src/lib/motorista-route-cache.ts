import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { requireMotoristaSession } from "@/lib/motorista-auth-route";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";
import { syncMotoristaOfflineAuthToServiceWorker } from "@/lib/motorista-sw-cache";
import { isMotoristaOnline } from "@/lib/motorista-online";

/** Hidrata IndexedDB na UI só quando offline — online usa dados já na memória/rede. */
export async function hydrateMotoristaCacheBeforeLoad(context: {
  queryClient: QueryClient;
}): Promise<void> {
  requireMotoristaSession();
  const session = getMotoristaSession();
  if (!session) return;

  await syncMotoristaOfflineAuthToServiceWorker(true);

  if (!isMotoristaOnline()) {
    await loadMotoristaCacheIntoQueries(context.queryClient, session.transportadoraId);
  }
}
