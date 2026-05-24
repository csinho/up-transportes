import type {
  Transportadora,
  Motorista,
  Veiculo,
  Cliente,
  ProdutoCarga,
  Viagem,
  ViagemEvento,
  ViagemOcorrencia,
  ViagemLocalizacao,
} from "@/types";
import type { Json } from "@/lib/supabase/database.types";

function omit<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

export function transportadoraToRow(t: Transportadora) {
  return {
    id: t.id,
    nome_fantasia: t.nome_fantasia,
    razao_social: t.razao_social,
    dados: omit(t as unknown as Record<string, unknown>, [
      "id",
      "nome_fantasia",
      "razao_social",
      "created_at",
      "updated_at",
    ]) as Json,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

export function transportadoraFromRow(row: {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  dados: Json;
  created_at: string;
  updated_at: string;
}): Transportadora {
  const dados = (row.dados ?? {}) as Record<string, unknown>;
  return {
    ...(dados as Omit<Transportadora, "id" | "nome_fantasia" | "razao_social" | "created_at" | "updated_at">),
    id: row.id,
    nome_fantasia: row.nome_fantasia,
    razao_social: row.razao_social,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function entityComTenantToRow<T extends { id: string; transportadora_id: string; created_at: string; updated_at: string }>(
  entity: T,
) {
  return {
    id: entity.id,
    transportadora_id: entity.transportadora_id,
    dados: omit(entity as unknown as Record<string, unknown>, [
      "id",
      "transportadora_id",
      "created_at",
      "updated_at",
    ]) as Json,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  };
}

function entityComTenantFromRow<T extends { id: string; transportadora_id: string; created_at: string; updated_at: string }>(
  row: { id: string; transportadora_id: string; dados: Json; created_at: string; updated_at: string },
): T {
  const dados = (row.dados ?? {}) as Record<string, unknown>;
  return {
    ...dados,
    id: row.id,
    transportadora_id: row.transportadora_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as T;
}

export const motoristaToRow = entityComTenantToRow<Motorista>;
export const motoristaFromRow = entityComTenantFromRow<Motorista>;
export const veiculoToRow = entityComTenantToRow<Veiculo>;
export const veiculoFromRow = entityComTenantFromRow<Veiculo>;
export const clienteToRow = entityComTenantToRow<Cliente>;
export const clienteFromRow = entityComTenantFromRow<Cliente>;
export const produtoToRow = entityComTenantToRow<ProdutoCarga>;
export const produtoFromRow = entityComTenantFromRow<ProdutoCarga>;

export function viagemToRow(v: Viagem) {
  return {
    id: v.id,
    transportadora_id: v.transportadora_id,
    numero_viagem: v.numero_viagem,
    status: v.status,
    dados: omit(v as unknown as Record<string, unknown>, [
      "id",
      "transportadora_id",
      "numero_viagem",
      "status",
      "created_at",
      "updated_at",
    ]) as Json,
    created_at: v.created_at,
    updated_at: v.updated_at,
  };
}

export function viagemFromRow(row: {
  id: string;
  transportadora_id: string;
  numero_viagem: number;
  status: string;
  dados: Json;
  created_at: string;
  updated_at: string;
}): Viagem {
  const dados = (row.dados ?? {}) as Record<string, unknown>;
  return {
    ...dados,
    id: row.id,
    transportadora_id: row.transportadora_id,
    numero_viagem: row.numero_viagem,
    status: row.status as Viagem["status"],
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as Viagem;
}

export function viagemEventoToRow(e: ViagemEvento) {
  return {
    id: e.id,
    transportadora_id: e.transportadora_id,
    viagem_id: e.viagem_id,
    dados: omit(e as unknown as Record<string, unknown>, [
      "id",
      "transportadora_id",
      "viagem_id",
      "created_at",
    ]) as Json,
    created_at: e.created_at,
  };
}

export function viagemEventoFromRow(row: {
  id: string;
  transportadora_id: string;
  viagem_id: string;
  dados: Json;
  created_at: string;
}): ViagemEvento {
  const dados = (row.dados ?? {}) as Record<string, unknown>;
  return {
    ...dados,
    id: row.id,
    transportadora_id: row.transportadora_id,
    viagem_id: row.viagem_id,
    created_at: row.created_at,
  } as ViagemEvento;
}

export function viagemOcorrenciaToRow(o: ViagemOcorrencia) {
  return {
    id: o.id,
    transportadora_id: o.transportadora_id,
    viagem_id: o.viagem_id,
    dados: omit(o as unknown as Record<string, unknown>, [
      "id",
      "transportadora_id",
      "viagem_id",
      "created_at",
      "updated_at",
    ]) as Json,
    created_at: o.created_at,
    updated_at: o.updated_at,
  };
}

export function viagemOcorrenciaFromRow(row: {
  id: string;
  transportadora_id: string;
  viagem_id: string;
  dados: Json;
  created_at: string;
  updated_at: string;
}): ViagemOcorrencia {
  const dados = (row.dados ?? {}) as Record<string, unknown>;
  return {
    ...dados,
    id: row.id,
    transportadora_id: row.transportadora_id,
    viagem_id: row.viagem_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as ViagemOcorrencia;
}

export function viagemLocalizacaoToRow(l: ViagemLocalizacao) {
  return {
    id: l.id,
    transportadora_id: l.transportadora_id,
    viagem_id: l.viagem_id,
    motorista_id: l.motorista_id ?? null,
    latitude: l.latitude,
    longitude: l.longitude,
    velocidade_kmh: l.velocidade_kmh ?? null,
    precisao_metros: l.precisao_metros ?? null,
    heading: l.heading ?? null,
    registrado_em: l.registrado_em,
    created_at: l.created_at,
  };
}

export function viagemLocalizacaoFromRow(row: {
  id: string;
  transportadora_id: string;
  viagem_id: string;
  motorista_id: string | null;
  latitude: number;
  longitude: number;
  velocidade_kmh: number | null;
  precisao_metros: number | null;
  heading: number | null;
  registrado_em: string;
  created_at: string;
}): ViagemLocalizacao {
  return {
    id: row.id,
    transportadora_id: row.transportadora_id,
    viagem_id: row.viagem_id,
    motorista_id: row.motorista_id ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    velocidade_kmh: row.velocidade_kmh ?? undefined,
    precisao_metros: row.precisao_metros ?? undefined,
    heading: row.heading ?? undefined,
    registrado_em: row.registrado_em,
    created_at: row.created_at,
  };
}
