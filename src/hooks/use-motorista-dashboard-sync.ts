import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";
import { isMotoristaOnline } from "@/lib/motorista-online";

/** Dashboard: hidrata cache local apenas offline (online mantém estado atual da UI). */
export function useMotoristaDashboardSync() {
  const qc = useQueryClient();
  const { session } = useMotoristaSession();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!session || isMotoristaOnline()) return;

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
