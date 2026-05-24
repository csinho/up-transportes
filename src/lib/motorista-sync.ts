import type { QueryClient } from "@tanstack/react-query";
import type { Viagem, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao, StatusViagem } from "@/types";
import {
  persistViagem,
  persistViagemEvento,
  persistViagemOcorrencia,
  persistViagemLocalizacao,
  invalidateMotoristaData,
} from "@/data/store";
import {
  enqueueOfflineOp,
  getOfflineQueue,
  clearOfflineQueue,
  type MotoristaOfflineOperation,
} from "@/lib/motorista-offline-queue";

export type SyncResult = "synced" | "queued";

export function isMotoristaOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

const SYNC_TIMEOUT_MS = 20_000;

async function withTimeout<T>(promise: Promise<T>, ms = SYNC_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Tempo esgotado ao sincronizar.")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function applyOp(op: MotoristaOfflineOperation): Promise<void> {
  switch (op.type) {
    case "viagem":
      await withTimeout(persistViagem(op.record));
      break;
    case "viagem_evento":
      await withTimeout(persistViagemEvento(op.record));
      break;
    case "viagem_ocorrencia":
      await withTimeout(persistViagemOcorrencia(op.record));
      break;
    case "viagem_localizacao":
      await withTimeout(persistViagemLocalizacao(op.record));
      break;
  }
}

export async function flushMotoristaOfflineQueue(qc: QueryClient): Promise<number> {
  const ops = getOfflineQueue();
  if (ops.length === 0) return 0;

  clearOfflineQueue();
  let synced = 0;

  for (const op of ops) {
    try {
      await applyOp(op);
      synced++;
    } catch {
      enqueueOfflineOp({
        id: op.id,
        type: op.type,
        record: op.record,
      });
    }
  }

  invalidateMotoristaData(qc);
  return synced;
}

/** Viagem + evento sempre juntos (ex.: finalizar, mudar status). */
export async function motoristaSyncViagemComEvento(
  viagem: Viagem,
  evento: ViagemEvento,
  qc: QueryClient,
): Promise<SyncResult> {
  const ops: Omit<MotoristaOfflineOperation, "queuedAt">[] = [
    { id: viagem.id, type: "viagem", record: viagem },
    { id: evento.id, type: "viagem_evento", record: evento },
  ];

  if (!isMotoristaOnline()) {
    for (const op of ops) enqueueOfflineOp(op);
    invalidateMotoristaData(qc);
    return "queued";
  }

  try {
    await withTimeout(persistViagem(viagem));
  } catch {
    for (const op of ops) enqueueOfflineOp(op);
    invalidateMotoristaData(qc);
    return "queued";
  }

  try {
    await withTimeout(persistViagemEvento(evento));
    invalidateMotoristaData(qc);
    return "synced";
  } catch {
    enqueueOfflineOp({ id: evento.id, type: "viagem_evento", record: evento });
    invalidateMotoristaData(qc);
    throw new Error("Viagem salva, mas o evento não foi registrado. Tentaremos reenviar.");
  }
}

async function persistOrQueue(
  op: Omit<MotoristaOfflineOperation, "queuedAt">,
  qc: QueryClient,
): Promise<SyncResult> {
  if (!isMotoristaOnline()) {
    enqueueOfflineOp(op);
    invalidateMotoristaData(qc);
    return "queued";
  }

  try {
    await applyOp(op as MotoristaOfflineOperation);
    invalidateMotoristaData(qc);
    return "synced";
  } catch {
    enqueueOfflineOp(op);
    invalidateMotoristaData(qc);
    return "queued";
  }
}

export async function motoristaSyncViagem(viagem: Viagem, qc: QueryClient): Promise<SyncResult> {
  return persistOrQueue({ id: viagem.id, type: "viagem", record: viagem }, qc);
}

export async function motoristaSyncEvento(evento: ViagemEvento, qc: QueryClient): Promise<SyncResult> {
  return persistOrQueue({ id: evento.id, type: "viagem_evento", record: evento }, qc);
}

export async function motoristaSyncOcorrencia(
  ocorrencia: ViagemOcorrencia,
  qc: QueryClient,
): Promise<SyncResult> {
  return persistOrQueue({ id: ocorrencia.id, type: "viagem_ocorrencia", record: ocorrencia }, qc);
}

export async function motoristaSyncLocalizacao(
  loc: ViagemLocalizacao,
  qc: QueryClient,
): Promise<SyncResult> {
  return persistOrQueue({ id: loc.id, type: "viagem_localizacao", record: loc }, qc);
}

const STATUS_COM_OCORRENCIA: StatusViagem[] = ["em_transito", "parada", "em_descarga"];

export function viagemStatusAposOcorrencia(status: StatusViagem): StatusViagem {
  return STATUS_COM_OCORRENCIA.includes(status) ? "com_ocorrencia" : status;
}

export type RegistrarOcorrenciaMotoristaInput = {
  ocorrencia: ViagemOcorrencia;
  evento: ViagemEvento;
  viagemAtualizada?: Viagem;
};

async function persistOcorrenciaCompleta(input: RegistrarOcorrenciaMotoristaInput): Promise<void> {
  if (input.viagemAtualizada) await withTimeout(persistViagem(input.viagemAtualizada));
  await withTimeout(persistViagemOcorrencia(input.ocorrencia));
  await withTimeout(persistViagemEvento(input.evento));
}

/** Persiste ou enfileira ocorrência + evento (+ viagem se necessário). */
export async function motoristaRegistrarOcorrencia(
  input: RegistrarOcorrenciaMotoristaInput,
  qc: QueryClient,
): Promise<SyncResult> {
  const ops: Omit<MotoristaOfflineOperation, "queuedAt">[] = [];
  if (input.viagemAtualizada) {
    ops.push({ id: input.viagemAtualizada.id, type: "viagem", record: input.viagemAtualizada });
  }
  ops.push({ id: input.ocorrencia.id, type: "viagem_ocorrencia", record: input.ocorrencia });
  ops.push({ id: input.evento.id, type: "viagem_evento", record: input.evento });

  if (!isMotoristaOnline()) {
    for (const op of ops) enqueueOfflineOp(op);
    invalidateMotoristaData(qc);
    return "queued";
  }

  try {
    await persistOcorrenciaCompleta(input);
    invalidateMotoristaData(qc);
    return "synced";
  } catch {
    for (const op of ops) enqueueOfflineOp(op);
    invalidateMotoristaData(qc);
    return "queued";
  }
}
