import type { QueryClient } from "@tanstack/react-query";
import type {
  UUID,
  Viagem,
  ViagemEvento,
  ViagemOcorrencia,
  ViagemLocalizacao,
  Veiculo,
  Cliente,
} from "@/types";
import { idbGet, idbPut } from "@/lib/motorista-idb";
import type { MotoristaOfflineOperation } from "@/lib/motorista-offline-queue";

const QUEUE_DOC_ID = "sync";
const LEGACY_QUEUE_KEY = "erp_transp_motorista_offline_v1";

export type MotoristaOfflineCache = {
  version: 1;
  tenantId: UUID;
  motoristaId: UUID;
  savedAt: string;
  viagens: Viagem[];
  veiculos: Veiculo[];
  clientes: Cliente[];
  viagemEventos: ViagemEvento[];
  viagemOcorrencias: ViagemOcorrencia[];
  viagemLocalizacoes: ViagemLocalizacao[];
};

type QueueDoc = { id: string; ops: MotoristaOfflineOperation[] };

function upsertById<T extends { id: string }>(list: T[], record: T): T[] {
  const i = list.findIndex((x) => x.id === record.id);
  if (i < 0) return [...list, record];
  const next = [...list];
  next[i] = record;
  return next;
}

export async function getMotoristaCache(tenantId: UUID): Promise<MotoristaOfflineCache | null> {
  return idbGet<MotoristaOfflineCache>("cache", tenantId);
}

export async function saveMotoristaCache(cache: MotoristaOfflineCache): Promise<void> {
  await idbPut("cache", cache);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("motorista-offline-cache"));
  }
}

export function applyOpToCache(
  cache: MotoristaOfflineCache,
  op: MotoristaOfflineOperation,
): MotoristaOfflineCache {
  switch (op.type) {
    case "viagem":
      return { ...cache, viagens: upsertById(cache.viagens, op.record), savedAt: new Date().toISOString() };
    case "viagem_evento":
      return {
        ...cache,
        viagemEventos: upsertById(cache.viagemEventos, op.record),
        savedAt: new Date().toISOString(),
      };
    case "viagem_ocorrencia":
      return {
        ...cache,
        viagemOcorrencias: upsertById(cache.viagemOcorrencias, op.record),
        savedAt: new Date().toISOString(),
      };
    case "viagem_localizacao":
      return {
        ...cache,
        viagemLocalizacoes: upsertById(cache.viagemLocalizacoes, op.record),
        savedAt: new Date().toISOString(),
      };
  }
}

export async function applyOpToMotoristaCache(
  tenantId: UUID,
  motoristaId: UUID,
  op: MotoristaOfflineOperation,
): Promise<MotoristaOfflineCache> {
  const existing =
    (await getMotoristaCache(tenantId)) ??
    emptyMotoristaCache(tenantId, motoristaId);
  const next = applyOpToCache(existing, op);
  await saveMotoristaCache(next);
  return next;
}

export function emptyMotoristaCache(tenantId: UUID, motoristaId: UUID): MotoristaOfflineCache {
  return {
    version: 1,
    tenantId,
    motoristaId,
    savedAt: new Date().toISOString(),
    viagens: [],
    veiculos: [],
    clientes: [],
    viagemEventos: [],
    viagemOcorrencias: [],
    viagemLocalizacoes: [],
  };
}

async function migrateLegacyQueue(): Promise<MotoristaOfflineOperation[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEGACY_QUEUE_KEY);
    if (!raw) return [];
    const ops = JSON.parse(raw) as MotoristaOfflineOperation[];
    localStorage.removeItem(LEGACY_QUEUE_KEY);
    if (ops.length > 0) await writeOfflineQueue(ops);
    return ops;
  } catch {
    return [];
  }
}

export async function readOfflineQueue(): Promise<MotoristaOfflineOperation[]> {
  await migrateLegacyQueue();
  const doc = await idbGet<QueueDoc>("queue", QUEUE_DOC_ID);
  return doc?.ops ?? [];
}

async function writeOfflineQueue(ops: MotoristaOfflineOperation[]): Promise<void> {
  await idbPut("queue", { id: QUEUE_DOC_ID, ops });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("motorista-offline-queue"));
  }
}

export async function enqueueOfflineOpInStore(
  op: Omit<MotoristaOfflineOperation, "queuedAt"> & { queuedAt?: string },
): Promise<void> {
  const queue = await readOfflineQueue();
  queue.push({
    ...op,
    queuedAt: op.queuedAt ?? new Date().toISOString(),
  } as MotoristaOfflineOperation);
  await writeOfflineQueue(queue);
}

export async function clearOfflineQueueInStore(): Promise<void> {
  await writeOfflineQueue([]);
}

export function subscribeOfflineCache(callback: () => void): () => void {
  window.addEventListener("motorista-offline-cache", callback);
  return () => window.removeEventListener("motorista-offline-cache", callback);
}

/** Atualiza React Query a partir do snapshot IndexedDB (sem rede). */
export function patchMotoristaQueriesFromCache(qc: QueryClient, cache: MotoristaOfflineCache): void {
  const { tenantId } = cache;

  qc.setQueryData(["viagens", tenantId], cache.viagens);
  qc.setQueryData(["veiculos", tenantId], cache.veiculos);
  qc.setQueryData(["clientes", tenantId], cache.clientes);

  const viagemIds = new Set(cache.viagens.map((v) => v.id));
  for (const viagemId of viagemIds) {
    const eventos = cache.viagemEventos
      .filter((e) => e.viagem_id === viagemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const ocorrencias = cache.viagemOcorrencias
      .filter((o) => o.viagem_id === viagemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const localizacoes = cache.viagemLocalizacoes
      .filter((l) => l.viagem_id === viagemId)
      .sort((a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime());

    qc.setQueryData(["viagem_eventos", tenantId, viagemId], eventos);
    qc.setQueryData(["viagem_ocorrencias", tenantId, viagemId], ocorrencias);
    qc.setQueryData(["viagem_localizacoes", tenantId, viagemId], localizacoes);
  }

  for (const v of cache.viagens) {
    qc.setQueryData(["viagens", "one", v.id], v);
  }
}
