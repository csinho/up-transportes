import type { QueryClient } from "@tanstack/react-query";
import type { Viagem } from "@/types";
import { getMotoristaSession } from "@/lib/motorista-session";
import {
  applyOpToCache,
  emptyMotoristaCache,
  getMotoristaCache,
  patchMotoristaQueriesFromCache,
  saveMotoristaCache,
} from "@/lib/motorista-offline-store";
import type { MotoristaOfflineOperation } from "@/lib/motorista-offline-queue";

/** Atualiza IndexedDB + React Query com dados já salvos (evita snapshot antigo sobrescrever). */
export async function commitMotoristaOpsToCache(
  qc: QueryClient,
  ops: Omit<MotoristaOfflineOperation, "queuedAt">[],
): Promise<void> {
  const session = getMotoristaSession();
  if (!session || ops.length === 0) return;

  const { transportadoraId, motoristaId } = session;
  let cache =
    (await getMotoristaCache(transportadoraId)) ??
    emptyMotoristaCache(transportadoraId, motoristaId);

  const now = new Date().toISOString();
  for (const op of ops) {
    cache = applyOpToCache(cache, {
      ...op,
      queuedAt: now,
    } as MotoristaOfflineOperation);
  }

  await saveMotoristaCache(cache);
  patchMotoristaQueriesFromCache(qc, cache);
}

/** Atualiza viagem na lista e no detalhe imediatamente na UI. */
export function patchMotoristaViagemInQueries(qc: QueryClient, viagem: Viagem): void {
  const tenantId = viagem.transportadora_id;
  qc.setQueryData(["viagens", tenantId], (old: Viagem[] | undefined) => {
    if (!old) return [viagem];
    const i = old.findIndex((v) => v.id === viagem.id);
    if (i < 0) return [...old, viagem];
    const next = [...old];
    next[i] = viagem;
    return next;
  });
  qc.setQueryData(["viagens", "one", viagem.id], viagem);
}
