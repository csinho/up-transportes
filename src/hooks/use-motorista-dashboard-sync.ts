import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";

/** Dashboard: só hidrata cache local na UI (setup completo roda no MotoristaShell). */
export function useMotoristaDashboardSync() {
  const qc = useQueryClient();
  const { session } = useMotoristaSession();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!session) return;

    void (async () => {
      setSyncing(true);
      try {
        await loadMotoristaCacheIntoQueries(qc, session.transportadoraId);
      } finally {
        setSyncing(false);
      }
    })();
  }, [qc, session?.transportadoraId]);

  return { syncing };
}
