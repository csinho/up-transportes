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
import { getMotoristaCache } from "@/lib/motorista-offline-store";
import * as sb from "@/data/supabase-repository";

const OFFLINE_MSG =
  "Sem dados no aparelho. Abra o dashboard do motorista com internet ao menos uma vez.";

function isMotoristaOfflineRead(): boolean {
  return typeof window !== "undefined" && isMotoristaAppPath() && !isMotoristaOnline();
}

async function requireMotoristaCache(tenantId: UUID) {
  const cache = await getMotoristaCache(tenantId);
  if (!cache) throw new Error(OFFLINE_MSG);
  return cache;
}

export async function fetchMotoristaViagens(tenantId: UUID): Promise<Viagem[]> {
  if (isMotoristaOfflineRead()) {
    return (await requireMotoristaCache(tenantId)).viagens;
  }
  await assertDataAccess();
  return sb.sbListViagens(tenantId);
}

export async function fetchMotoristaVeiculos(tenantId: UUID): Promise<Veiculo[]> {
  if (isMotoristaOfflineRead()) {
    return (await requireMotoristaCache(tenantId)).veiculos;
  }
  await assertDataAccess();
  return sb.sbListVeiculos(tenantId);
}

export async function fetchMotoristaClientes(tenantId: UUID): Promise<Cliente[]> {
  if (isMotoristaOfflineRead()) {
    return (await requireMotoristaCache(tenantId)).clientes;
  }
  await assertDataAccess();
  return sb.sbListClientes(tenantId);
}

export async function fetchMotoristaViagem(id: UUID, tenantId: UUID): Promise<Viagem | null> {
  if (isMotoristaOfflineRead()) {
    return (await requireMotoristaCache(tenantId)).viagens.find((v) => v.id === id) ?? null;
  }
  await assertDataAccess();
  return sb.sbGetViagem(id);
}

export async function fetchMotoristaViagemEventos(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemEvento[]> {
  if (isMotoristaOfflineRead()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagemEventos
      .filter((e) => e.viagem_id === viagemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  await assertDataAccess();
  return sb.sbListViagemEventos(tenantId, viagemId);
}

export async function fetchMotoristaViagemOcorrencias(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemOcorrencia[]> {
  if (isMotoristaOfflineRead()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagemOcorrencias
      .filter((o) => o.viagem_id === viagemId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  await assertDataAccess();
  return sb.sbListViagemOcorrencias(tenantId, viagemId);
}

export async function fetchMotoristaViagemLocalizacoes(
  tenantId: UUID,
  viagemId: UUID,
): Promise<ViagemLocalizacao[]> {
  if (isMotoristaOfflineRead()) {
    const cache = await requireMotoristaCache(tenantId);
    return cache.viagemLocalizacoes
      .filter((l) => l.viagem_id === viagemId)
      .sort((a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime());
  }
  await assertDataAccess();
  return sb.sbListViagemLocalizacoes(tenantId, viagemId);
}
