import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { requireMotoristaSession } from "@/lib/motorista-auth-route";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";
import { syncMotoristaOfflineAuthToServiceWorker } from "@/lib/motorista-sw-cache";

/** Hidrata React Query do IndexedDB antes de renderizar telas protegidas. */
export async function hydrateMotoristaCacheBeforeLoad(context: {
  queryClient: QueryClient;
}): Promise<void> {
  requireMotoristaSession();
  const session = getMotoristaSession();
  if (!session) return;

  await syncMotoristaOfflineAuthToServiceWorker(true);
  await loadMotoristaCacheIntoQueries(context.queryClient, session.transportadoraId);
}
