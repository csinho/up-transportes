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
import { isMotoristaAppPath } from "@/lib/motorista-app-path";
import { getMotoristaSession } from "@/lib/motorista-session";
import {
  getMotoristaCache,
  type MotoristaOfflineCache,
} from "@/lib/motorista-offline-store";
import * as sb from "@/data/supabase-repository";

export const OFFLINE_MSG =
  "Sem dados no aparelho. Abra o dashboard com internet ao menos uma vez.";

function isMotoristaOfflineMode(): boolean {
  return (
    typeof window !== "undefined" &&
    isMotoristaAppPath() &&
    !!getMotoristaSession() &&
    !isMotoristaOnline()
  );
}

async function withMotoristaCache<T>(
  tenantId: UUID,
  read: (cache: MotoristaOfflineCache) => T,
  fetchNetwork: () => Promise<T>,
): Promise<T> {
  const cache = await getMotoristaCache(tenantId);

  if (isMotoristaOfflineMode()) {
    if (!cache) throw new Error(OFFLINE_MSG);
    return read(cache);
  }

  try {
    await assertDataAccess();
    return await fetchNetwork();
  } catch (err) {
    if (isMotoristaAppPath() && getMotoristaSession() && cache) {
      return read(cache);
    }
    throw err;
  }
}

export async function fetchMotoristaViagens(tenantId: UUID): Promise<Viagem[]> {
  return withMotoristaCache(
    tenantId,
    (c) => c.viagens,
    () => sb.sbListViagens(tenantId),
  );
}

export async function fetchMotoristaVeiculos(tenantId: UUID): Promise<Veiculo[]> {
  return withMotoristaCache(
    tenantId,
    (c) => c.veiculos,
    () => sb.sbListVeiculos(tenantId),
  );
}

export async function fetchMotoristaClientes(tenantId: UUID): Promise<Cliente[]> {
  return withMotoristaCache(
    tenantId,
    (c) => c.clientes,
    () => sb.sbListClientes(tenantId),
  );
}

export async function fetchMotoristaViagem(id: UUID, tenantId: UUID): Promise<Viagem | null> {
  return withMotoristaCache(
    tenantId,
    (c) => c.viagens.find((v) => v.id === id) ?? null,
    () => sb.sbGetViagem(id),
  );
}

export async function fetchMotoristaViagemEventos(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemEvento[]> {
  return withMotoristaCache(
    tenantId,
    (c) =>
      c.viagemEventos
        .filter((e) => e.viagem_id === viagemId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    () => sb.sbListViagemEventos(tenantId, viagemId),
  );
}

export async function fetchMotoristaViagemOcorrencias(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemOcorrencia[]> {
  return withMotoristaCache(
    tenantId,
    (c) =>
      c.viagemOcorrencias
        .filter((o) => o.viagem_id === viagemId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    () => sb.sbListViagemOcorrencias(tenantId, viagemId),
  );
}

export async function fetchMotoristaViagemLocalizacoes(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemLocalizacao[]> {
  return withMotoristaCache(
    tenantId,
    (c) =>
      c.viagemLocalizacoes
        .filter((l) => l.viagem_id === viagemId)
        .sort((a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime()),
    () => sb.sbListViagemLocalizacoes(tenantId, viagemId),
  );
}
