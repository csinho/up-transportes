import type { QueryClient } from "@tanstack/react-query";
import type { Viagem, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao, StatusViagem } from "@/types";
import {
  persistViagem,
  persistViagemEvento,
  persistViagemOcorrencia,
  persistViagemLocalizacao,
} from "@/data/store";
import { commitMotoristaOpsToCache, patchMotoristaViagemInQueries } from "@/lib/motorista-cache-commit";
import { invalidateMotoristaData } from "@/lib/motorista-invalidate";
import { getMotoristaSession } from "@/lib/motorista-session";
import {
  applyOpToMotoristaCache,
  patchMotoristaQueriesFromCache,
} from "@/lib/motorista-offline-store";
import {
  enqueueOfflineOp,
  getOfflineQueue,
  clearOfflineQueue,
  type MotoristaOfflineOperation,
} from "@/lib/motorista-offline-queue";

import { isMotoristaOnline } from "@/lib/motorista-online";
import { refreshMotoristaSnapshotFromNetwork } from "@/lib/motorista-cache-sync";

export type SyncResult = "synced" | "queued";
export { isMotoristaOnline };

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

async function queueAndCache(
  op: Omit<MotoristaOfflineOperation, "queuedAt">,
  qc: QueryClient,
): Promise<void> {
  await enqueueOfflineOp(op);
  const session = getMotoristaSession();
  if (session) {
    const cache = await applyOpToMotoristaCache(
      session.transportadoraId,
      session.motoristaId,
      { ...op, queuedAt: new Date().toISOString() } as MotoristaOfflineOperation,
    );
    patchMotoristaQueriesFromCache(qc, cache);
  } else {
    invalidateMotoristaData(qc);
  }
}

export async function flushMotoristaOfflineQueue(qc: QueryClient): Promise<number> {
  const ops = await getOfflineQueue();
  if (ops.length === 0) return 0;

  await clearOfflineQueue();
  let synced = 0;

  for (const op of ops) {
    try {
      await applyOp(op);
      synced++;
    } catch {
      await enqueueOfflineOp({
        id: op.id,
        type: op.type,
        record: op.record,
      });
    }
  }

  if (isMotoristaOnline()) {
    const session = getMotoristaSession();
    if (session) {
      const refreshed = await refreshMotoristaSnapshotFromNetwork(
        session.transportadoraId,
        session.motoristaId,
      );
      if (refreshed.ok) {
        patchMotoristaQueriesFromCache(qc, refreshed.cache);
      } else {
        invalidateMotoristaData(qc);
      }
    }
  } else {
    invalidateMotoristaData(qc);
  }
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
    for (const op of ops) await queueAndCache(op, qc);
    return "queued";
  }

  try {
    await withTimeout(persistViagem(viagem));
  } catch {
    for (const op of ops) await queueAndCache(op, qc);
    return "queued";
  }

  try {
    await withTimeout(persistViagemEvento(evento));
    await commitMotoristaOpsToCache(qc, ops);
    patchMotoristaViagemInQueries(qc, viagem);
    return "synced";
  } catch {
    await queueAndCache({ id: evento.id, type: "viagem_evento", record: evento }, qc);
    throw new Error("Viagem salva, mas o evento não foi registrado. Tentaremos reenviar.");
  }
}

async function persistOrQueue(
  op: Omit<MotoristaOfflineOperation, "queuedAt">,
  qc: QueryClient,
): Promise<SyncResult> {
  if (!isMotoristaOnline()) {
    await queueAndCache(op, qc);
    return "queued";
  }

  try {
    await applyOp(op as MotoristaOfflineOperation);
    await commitMotoristaOpsToCache(qc, [op]);
    if (op.type === "viagem") patchMotoristaViagemInQueries(qc, op.record);
    return "synced";
  } catch {
    await queueAndCache(op, qc);
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

const STATUS_COM_OCORRENCIA: StatusViagem[] = [
  "em_transito",
  "parada",
  "aguardando_descarga",
  "em_descarga",
];

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
    for (const op of ops) await queueAndCache(op, qc);
    return "queued";
  }

  try {
    await persistOcorrenciaCompleta(input);
    await commitMotoristaOpsToCache(qc, ops);
    if (input.viagemAtualizada) patchMotoristaViagemInQueries(qc, input.viagemAtualizada);
    return "synced";
  } catch {
    for (const op of ops) await queueAndCache(op, qc);
    return "queued";
  }
}
