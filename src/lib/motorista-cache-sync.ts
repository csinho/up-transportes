import type { QueryClient } from "@tanstack/react-query";
import type { UUID } from "@/types";
import * as sb from "@/data/supabase-repository";
import { assertDataAccess } from "@/data/store-access";
import { isMotoristaOnline } from "@/lib/motorista-online";
import {
  emptyMotoristaCache,
  getMotoristaCache,
  patchMotoristaQueriesFromCache,
  saveMotoristaCache,
  type MotoristaOfflineCache,
} from "@/lib/motorista-offline-store";

/** Baixa dados do Supabase e grava snapshot no IndexedDB. */
export async function refreshMotoristaSnapshotFromNetwork(
  tenantId: UUID,
  motoristaId: UUID,
): Promise<MotoristaOfflineCache> {
  await assertDataAccess();

  const [viagens, veiculos, clientes, viagemEventos, viagemOcorrencias, viagemLocalizacoes] =
    await Promise.all([
      sb.sbListViagens(tenantId),
      sb.sbListVeiculos(tenantId),
      sb.sbListClientes(tenantId),
      sb.sbListViagemEventos(tenantId),
      sb.sbListViagemOcorrencias(tenantId),
      sb.sbListViagemLocalizacoes(tenantId),
    ]);

  const cache: MotoristaOfflineCache = {
    version: 1,
    tenantId,
    motoristaId,
    savedAt: new Date().toISOString(),
    viagens,
    veiculos,
    clientes,
    viagemEventos,
    viagemOcorrencias,
    viagemLocalizacoes,
  };

  await saveMotoristaCache(cache);
  return cache;
}

export async function hydrateMotoristaQueries(
  qc: QueryClient,
  tenantId: UUID,
  motoristaId: UUID,
): Promise<void> {
  const cached = await getMotoristaCache(tenantId);
  if (cached) patchMotoristaQueriesFromCache(qc, cached);

  if (isMotoristaOnline()) {
    try {
      const fresh = await refreshMotoristaSnapshotFromNetwork(tenantId, motoristaId);
      patchMotoristaQueriesFromCache(qc, fresh);
    } catch (err) {
      console.warn("[motorista] Falha ao atualizar cache online:", err);
    }
  }
}
