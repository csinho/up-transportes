import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import {
  loadMotoristaCacheIntoQueries,
  syncMotoristaDashboardCache,
} from "@/lib/motorista-cache-sync";
import { patchMotoristaQueriesFromCache } from "@/lib/motorista-offline-store";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { cacheMotoristaShellInServiceWorker } from "@/lib/motorista-sw-cache";

/**
 * Só no dashboard do motorista: grava snapshot no IndexedDB (online)
 * e hidrata a UI para uso offline depois.
 */
export function useMotoristaDashboardSync() {
  const qc = useQueryClient();
  const { session } = useMotoristaSession();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!session) return;

    void (async () => {
      setSyncing(true);
      try {
        const result = await syncMotoristaDashboardCache(
          qc,
          session.transportadoraId,
          session.motoristaId,
        );
        if (!result) return;

        if (result.ok) {
          patchMotoristaQueriesFromCache(qc, result.cache);
          if (isMotoristaOnline()) {
            await cacheMotoristaShellInServiceWorker();
            toast.success("Dados salvos no aparelho para uso offline");
          }
        } else {
          console.error("[motorista-offline] Falha no snapshot:", result.error);
          const hadCache = await loadMotoristaCacheIntoQueries(qc, session.transportadoraId);
          if (!hadCache && isMotoristaOnline()) {
            toast.error("Não foi possível salvar dados offline. Tente atualizar a página.");
          }
        }
      } finally {
        setSyncing(false);
      }
    })();
  }, [qc, session?.transportadoraId, session?.motoristaId]);

  return { syncing };
}
