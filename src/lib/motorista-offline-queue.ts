import type { Viagem, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao } from "@/types";
import {
  clearOfflineQueueInStore,
  enqueueOfflineOpInStore,
  readOfflineQueue,
} from "@/lib/motorista-offline-store";

export type MotoristaOfflineOperation =
  | { id: string; type: "viagem"; record: Viagem; queuedAt: string }
  | { id: string; type: "viagem_evento"; record: ViagemEvento; queuedAt: string }
  | { id: string; type: "viagem_ocorrencia"; record: ViagemOcorrencia; queuedAt: string }
  | { id: string; type: "viagem_localizacao"; record: ViagemLocalizacao; queuedAt: string };

let queueCountCache = 0;

async function refreshQueueCountCache(): Promise<void> {
  queueCountCache = (await readOfflineQueue()).length;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("motorista-offline-queue"));
  }
}

export function getOfflineQueueCount(): number {
  return queueCountCache;
}

export async function initOfflineQueueCache(): Promise<void> {
  await refreshQueueCountCache();
}

export async function getOfflineQueue(): Promise<MotoristaOfflineOperation[]> {
  return readOfflineQueue();
}

export async function enqueueOfflineOp(
  op: Omit<MotoristaOfflineOperation, "queuedAt"> & { queuedAt?: string },
): Promise<void> {
  await enqueueOfflineOpInStore(op);
  await refreshQueueCountCache();
}

export async function clearOfflineQueue(): Promise<void> {
  await clearOfflineQueueInStore();
  await refreshQueueCountCache();
}

export function subscribeOfflineQueue(callback: () => void): () => void {
  window.addEventListener("motorista-offline-queue", callback);
  return () => window.removeEventListener("motorista-offline-queue", callback);
}
