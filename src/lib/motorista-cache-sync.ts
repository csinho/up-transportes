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

export type MotoristaSnapshotResult =
  | { ok: true; cache: MotoristaOfflineCache }
  | { ok: false; error: string };

/** Baixa dados do Supabase e grava snapshot completo no IndexedDB (somente app motorista). */
export async function refreshMotoristaSnapshotFromNetwork(
  tenantId: UUID,
  motoristaId: UUID,
): Promise<MotoristaSnapshotResult> {
  try {
    await assertDataAccess();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sessão inválida";
    return { ok: false, error: msg };
  }

  const base = emptyMotoristaCache(tenantId, motoristaId);
  const errors: string[] = [];

  const [viagensR, veiculosR, clientesR, eventosR, ocorrenciasR, locR] = await Promise.allSettled([
    sb.sbListViagens(tenantId),
    sb.sbListVeiculos(tenantId),
    sb.sbListClientes(tenantId),
    sb.sbListViagemEventos(tenantId),
    sb.sbListViagemOcorrencias(tenantId),
    sb.sbListViagemLocalizacoes(tenantId),
  ]);

  if (viagensR.status === "fulfilled") base.viagens = viagensR.value;
  else errors.push(`viagens: ${reasonMessage(viagensR.reason)}`);

  if (veiculosR.status === "fulfilled") base.veiculos = veiculosR.value;
  else errors.push(`veículos: ${reasonMessage(veiculosR.reason)}`);

  if (clientesR.status === "fulfilled") base.clientes = clientesR.value;
  else errors.push(`clientes: ${reasonMessage(clientesR.reason)}`);

  if (eventosR.status === "fulfilled") base.viagemEventos = eventosR.value;
  else errors.push(`eventos: ${reasonMessage(eventosR.reason)}`);

  if (ocorrenciasR.status === "fulfilled") base.viagemOcorrencias = ocorrenciasR.value;
  else errors.push(`ocorrências: ${reasonMessage(ocorrenciasR.reason)}`);

  if (locR.status === "fulfilled") base.viagemLocalizacoes = locR.value;
  else errors.push(`localizações: ${reasonMessage(locR.reason)}`);

  if (base.viagens.length === 0 && errors.length > 0) {
    return { ok: false, error: errors.join("; ") };
  }

  base.savedAt = new Date().toISOString();
  await saveMotoristaCache(base);

  console.info(
    `[motorista-offline] IndexedDB atualizado: ${base.viagens.length} viagem(ns), fila pronta para sync.`,
  );

  if (errors.length > 0) {
    console.warn("[motorista-offline] Snapshot parcial:", errors.join("; "));
  }

  return { ok: true, cache: base };
}

function reasonMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

/** Lê cache local para a UI (sem baixar de novo). */
export async function loadMotoristaCacheIntoQueries(
  qc: QueryClient,
  tenantId: UUID,
): Promise<boolean> {
  const cached = await getMotoristaCache(tenantId);
  if (!cached) return false;
  patchMotoristaQueriesFromCache(qc, cached);
  return true;
}

/** Dashboard: cache local + snapshot online quando possível. */
export async function syncMotoristaDashboardCache(
  qc: QueryClient,
  tenantId: UUID,
  motoristaId: UUID,
): Promise<MotoristaSnapshotResult | null> {
  await loadMotoristaCacheIntoQueries(qc, tenantId);

  if (!isMotoristaOnline()) {
    const cached = await getMotoristaCache(tenantId);
    if (cached) return { ok: true, cache: cached };
    return { ok: false, error: "Sem internet e sem dados salvos no aparelho." };
  }

  return refreshMotoristaSnapshotFromNetwork(tenantId, motoristaId);
}
