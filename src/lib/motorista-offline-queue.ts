import type { Viagem, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao } from "@/types";

const QUEUE_KEY = "erp_transp_motorista_offline_v1";

export type MotoristaOfflineOperation =
  | { id: string; type: "viagem"; record: Viagem; queuedAt: string }
  | { id: string; type: "viagem_evento"; record: ViagemEvento; queuedAt: string }
  | { id: string; type: "viagem_ocorrencia"; record: ViagemOcorrencia; queuedAt: string }
  | { id: string; type: "viagem_localizacao"; record: ViagemLocalizacao; queuedAt: string };

function notifyQueueChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("motorista-offline-queue"));
  }
}

function readQueue(): MotoristaOfflineOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MotoristaOfflineOperation[];
  } catch {
    return [];
  }
}

function writeQueue(ops: MotoristaOfflineOperation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  notifyQueueChange();
}

export function getOfflineQueue(): MotoristaOfflineOperation[] {
  return readQueue();
}

export function getOfflineQueueCount(): number {
  return readQueue().length;
}

export function enqueueOfflineOp(
  op: Omit<MotoristaOfflineOperation, "queuedAt"> & { queuedAt?: string },
): void {
  const queue = readQueue();
  queue.push({ ...op, queuedAt: op.queuedAt ?? new Date().toISOString() } as MotoristaOfflineOperation);
  writeQueue(queue);
}

export function clearOfflineQueue(): void {
  writeQueue([]);
}

export function subscribeOfflineQueue(callback: () => void): () => void {
  window.addEventListener("motorista-offline-queue", callback);
  return () => window.removeEventListener("motorista-offline-queue", callback);
}
