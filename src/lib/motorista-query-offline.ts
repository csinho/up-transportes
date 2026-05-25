import type {
  UUID,
  Viagem,
  Veiculo,
  Cliente,
  ViagemEvento,
  ViagemOcorrencia,
  ViagemLocalizacao,
} from "@/types";
import { assertDataAccess } from "@/data/store-access";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { isMotoristaDataContext } from "@/lib/motorista-data-context";
import { getMotoristaSession } from "@/lib/motorista-session";
import {
  getMotoristaCache,
  saveMotoristaCache,
  type MotoristaOfflineCache,
} from "@/lib/motorista-offline-store";
import * as sb from "@/data/supabase-repository";

const OFFLINE_MSG =
  "Sem dados no aparelho. Abra o app com internet ao menos uma vez para baixar suas viagens.";

async function requireMotoristaCache(tenantId: UUID): Promise<MotoristaOfflineCache> {
  const cache = await getMotoristaCache(tenantId);
  if (!cache) throw new Error(OFFLINE_MSG);
  return cache;
}

async function persistListToCache(
  tenantId: UUID,
  patch: Partial<
    Pick<
      MotoristaOfflineCache,
      "viagens" | "veiculos" | "clientes" | "viagemEventos" | "viagemOcorrencias" | "viagemLocalizacoes"
    >
  >,
): Promise<void> {
  const session = getMotoristaSession();
  if (!session) return;
  const base =
    (await getMotoristaCache(tenantId)) ?? {
      version: 1 as const,
      tenantId,
      motoristaId: session.motoristaId,
      savedAt: new Date().toISOString(),
      viagens: [],
      veiculos: [],
      clientes: [],
      viagemEventos: [],
      viagemOcorrencias: [],
      viagemLocalizacoes: [],
    };
  await saveMotoristaCache({
    ...base,
    ...patch,
    savedAt: new Date().toISOString(),
  });
}

export async function fetchMotoristaViagens(tenantId: UUID): Promise<Viagem[]> {
  if (isMotoristaDataContext() && !isMotoristaOnline()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagens;
  }
  await assertDataAccess();
  const data = await sb.sbListViagens(tenantId);
  if (isMotoristaDataContext()) await persistListToCache(tenantId, { viagens: data });
  return data;
}

export async function fetchMotoristaVeiculos(tenantId: UUID): Promise<Veiculo[]> {
  if (isMotoristaDataContext() && !isMotoristaOnline()) {
    return (await requireMotoristaCache(tenantId)).veiculos;
  }
  await assertDataAccess();
  const data = await sb.sbListVeiculos(tenantId);
  if (isMotoristaDataContext()) await persistListToCache(tenantId, { veiculos: data });
  return data;
}

export async function fetchMotoristaClientes(tenantId: UUID): Promise<Cliente[]> {
  if (isMotoristaDataContext() && !isMotoristaOnline()) {
    return (await requireMotoristaCache(tenantId)).clientes;
  }
  await assertDataAccess();
  const data = await sb.sbListClientes(tenantId);
  if (isMotoristaDataContext()) await persistListToCache(tenantId, { clientes: data });
  return data;
}

export async function fetchMotoristaViagem(id: UUID, tenantId: UUID): Promise<Viagem | null> {
  if (isMotoristaDataContext() && !isMotoristaOnline()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagens.find((v) => v.id === id) ?? null;
  }
  await assertDataAccess();
  const row = await sb.sbGetViagem(id);
  if (row && isMotoristaDataContext()) {
    const cache = await getMotoristaCache(tenantId);
    if (cache) {
      const viagens = cache.viagens.some((v) => v.id === id)
        ? cache.viagens.map((v) => (v.id === id ? row : v))
        : [...cache.viagens, row];
      await persistListToCache(tenantId, { viagens });
    }
  }
  return row;
}

export async function fetchMotoristaViagemEventos(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemEvento[]> {
  if (isMotoristaDataContext() && !isMotoristaOnline()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagemEventos
      .filter((e) => e.viagem_id === viagemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  await assertDataAccess();
  const rows = await sb.sbListViagemEventos(tenantId, viagemId);
  if (isMotoristaDataContext()) {
    const cache = await getMotoristaCache(tenantId);
    const merged = cache
      ? mergeSublist(cache.viagemEventos, rows, viagemId)
      : rows;
    await persistListToCache(tenantId, { viagemEventos: merged });
  }
  return rows;
}

export async function fetchMotoristaViagemOcorrencias(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemOcorrencia[]> {
  if (isMotoristaDataContext() && !isMotoristaOnline()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagemOcorrencias
      .filter((o) => o.viagem_id === viagemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  await assertDataAccess();
  const rows = await sb.sbListViagemOcorrencias(tenantId, viagemId);
  if (isMotoristaDataContext()) {
    const cache = await getMotoristaCache(tenantId);
    const merged = cache ? mergeSublist(cache.viagemOcorrencias, rows, viagemId) : rows;
    await persistListToCache(tenantId, { viagemOcorrencias: merged });
  }
  return rows;
}

export async function fetchMotoristaViagemLocalizacoes(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemLocalizacao[]> {
  if (isMotoristaDataContext() && !isMotoristaOnline()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagemLocalizacoes
      .filter((l) => l.viagem_id === viagemId)
      .sort((a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime());
  }
  await assertDataAccess();
  const rows = await sb.sbListViagemLocalizacoes(tenantId, viagemId);
  if (isMotoristaDataContext()) {
    const cache = await getMotoristaCache(tenantId);
    const merged = cache ? mergeSublist(cache.viagemLocalizacoes, rows, viagemId) : rows;
    await persistListToCache(tenantId, { viagemLocalizacoes: merged });
  }
  return rows;
}

function mergeSublist<T extends { id: string; viagem_id: UUID }>(
  existing: T[],
  fetched: T[],
  viagemId: UUID,
): T[] {
  const rest = existing.filter((x) => x.viagem_id !== viagemId);
  return [...rest, ...fetched];
}
