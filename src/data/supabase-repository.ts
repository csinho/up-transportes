import { getSupabaseClient } from "@/lib/supabase/client";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";
import {
  transportadoraFromRow,
  transportadoraToRow,
  motoristaFromRow,
  motoristaToRow,
  veiculoFromRow,
  veiculoToRow,
  clienteFromRow,
  clienteToRow,
  produtoFromRow,
  produtoToRow,
  viagemFromRow,
  viagemToRow,
  viagemEventoFromRow,
  viagemEventoToRow,
  viagemOcorrenciaFromRow,
  viagemOcorrenciaToRow,
  viagemLocalizacaoFromRow,
  viagemLocalizacaoToRow,
} from "@/lib/supabase/mappers";
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
  UUID,
} from "@/types";

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");
  return supabase;
}

export async function sbListTransportadoras(): Promise<Transportadora[]> {
  const supabase = client();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: links, error: linkErr } = await supabase
    .from("user_transportadoras")
    .select("transportadora_id")
    .eq("user_id", userId);
  if (linkErr) lancarErroSupabase(linkErr);

  const ids = (links ?? []).map((l) => l.transportadora_id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("transportadoras")
    .select("*")
    .in("id", ids)
    .eq("ativa", true)
    .order("nome_fantasia");
  if (error) lancarErroSupabase(error);
  return (data ?? []).map(transportadoraFromRow);
}

export async function sbGetTransportadora(id: UUID): Promise<Transportadora | null> {
  const { data, error } = await client().from("transportadoras").select("*").eq("id", id).maybeSingle();
  if (error) lancarErroSupabase(error);
  return data ? transportadoraFromRow(data) : null;
}

export async function sbUpsertTransportadora(t: Transportadora): Promise<Transportadora> {
  const { data, error } = await client().from("transportadoras").upsert(transportadoraToRow(t)).select().single();
  if (error) lancarErroSupabase(error);
  return transportadoraFromRow(data);
}

async function sbListTenant<T>(
  table: "motoristas" | "veiculos" | "clientes" | "produtos" | "viagens",
  tenantId: UUID,
  fromRow: (row: never) => T,
): Promise<T[]> {
  const { data, error } = await client()
    .from(table)
    .select("*")
    .eq("transportadora_id", tenantId);
  if (error) lancarErroSupabase(error);
  return (data ?? []).map((r) => fromRow(r as never));
}

async function sbGetEntity<T>(
  table: "motoristas" | "veiculos" | "clientes" | "produtos" | "viagens" | "transportadoras",
  id: UUID,
  fromRow: (row: never) => T,
): Promise<T | null> {
  const { data, error } = await client().from(table).select("*").eq("id", id).maybeSingle();
  if (error) lancarErroSupabase(error);
  return data ? fromRow(data as never) : null;
}

async function sbUpsertEntity<T, R>(
  table: "motoristas" | "veiculos" | "clientes" | "produtos" | "viagens",
  row: R,
  fromRow: (row: never) => T,
): Promise<T> {
  const { data, error } = await client().from(table).upsert(row as never).select().single();
  if (error) lancarErroSupabase(error);
  return fromRow(data as never);
}

async function sbRemoveEntity(table: "motoristas" | "veiculos" | "clientes" | "produtos" | "viagens", id: UUID) {
  const { error } = await client().from(table).delete().eq("id", id);
  if (error) lancarErroSupabase(error);
}

export const sbListMotoristas = (tenantId: UUID) => sbListTenant("motoristas", tenantId, motoristaFromRow);
export const sbListVeiculos = (tenantId: UUID) => sbListTenant("veiculos", tenantId, veiculoFromRow);
export const sbListClientes = (tenantId: UUID) => sbListTenant("clientes", tenantId, clienteFromRow);
export const sbListProdutos = (tenantId: UUID) => sbListTenant("produtos", tenantId, produtoFromRow);
export const sbListViagens = (tenantId: UUID) => sbListTenant("viagens", tenantId, viagemFromRow);

export const sbGetMotorista = (id: UUID) => sbGetEntity("motoristas", id, motoristaFromRow);
export const sbGetVeiculo = (id: UUID) => sbGetEntity("veiculos", id, veiculoFromRow);
export const sbGetCliente = (id: UUID) => sbGetEntity("clientes", id, clienteFromRow);
export const sbGetProduto = (id: UUID) => sbGetEntity("produtos", id, produtoFromRow);
export const sbGetViagem = (id: UUID) => sbGetEntity("viagens", id, viagemFromRow);

export const sbUpsertMotorista = (m: Motorista) => sbUpsertEntity("motoristas", motoristaToRow(m), motoristaFromRow);
export const sbUpsertVeiculo = (v: Veiculo) => sbUpsertEntity("veiculos", veiculoToRow(v), veiculoFromRow);
export const sbUpsertCliente = (c: Cliente) => sbUpsertEntity("clientes", clienteToRow(c), clienteFromRow);
export const sbUpsertProduto = (p: ProdutoCarga) => sbUpsertEntity("produtos", produtoToRow(p), produtoFromRow);
export const sbUpsertViagem = (v: Viagem) => sbUpsertEntity("viagens", viagemToRow(v), viagemFromRow);

export const sbRemoveMotorista = (id: UUID) => sbRemoveEntity("motoristas", id);
export const sbRemoveVeiculo = (id: UUID) => sbRemoveEntity("veiculos", id);
export const sbRemoveCliente = (id: UUID) => sbRemoveEntity("clientes", id);
export const sbRemoveProduto = (id: UUID) => sbRemoveEntity("produtos", id);
export const sbRemoveViagem = (id: UUID) => sbRemoveEntity("viagens", id);

export async function sbListAllMotoristas(): Promise<Motorista[]> {
  const { data, error } = await client().from("motoristas").select("*");
  if (error) lancarErroSupabase(error);
  return (data ?? []).map(motoristaFromRow);
}

export async function sbListViagemEventos(tenantId: UUID, viagemId?: UUID): Promise<ViagemEvento[]> {
  let q = client().from("viagem_eventos").select("*").eq("transportadora_id", tenantId);
  if (viagemId) q = q.eq("viagem_id", viagemId);
  const { data, error } = await q;
  if (error) lancarErroSupabase(error);
  return (data ?? []).map(viagemEventoFromRow);
}

export async function sbListViagemOcorrencias(tenantId: UUID, viagemId?: UUID): Promise<ViagemOcorrencia[]> {
  let q = client().from("viagem_ocorrencias").select("*").eq("transportadora_id", tenantId);
  if (viagemId) q = q.eq("viagem_id", viagemId);
  const { data, error } = await q;
  if (error) lancarErroSupabase(error);
  return (data ?? []).map(viagemOcorrenciaFromRow);
}

export async function sbListViagemLocalizacoes(tenantId: UUID, viagemId?: UUID): Promise<ViagemLocalizacao[]> {
  let q = client().from("viagem_localizacoes").select("*").eq("transportadora_id", tenantId);
  if (viagemId) q = q.eq("viagem_id", viagemId);
  const { data, error } = await q.order("registrado_em", { ascending: true });
  if (error) lancarErroSupabase(error);
  return (data ?? []).map(viagemLocalizacaoFromRow);
}

export async function sbUpsertViagemEvento(e: ViagemEvento): Promise<ViagemEvento> {
  const { data, error } = await client()
    .from("viagem_eventos")
    .upsert(viagemEventoToRow(e))
    .select()
    .single();
  if (error) lancarErroSupabase(error);
  return viagemEventoFromRow(data);
}

export async function sbUpsertViagemOcorrencia(o: ViagemOcorrencia): Promise<ViagemOcorrencia> {
  const { data, error } = await client()
    .from("viagem_ocorrencias")
    .upsert(viagemOcorrenciaToRow(o))
    .select()
    .single();
  if (error) lancarErroSupabase(error);
  return viagemOcorrenciaFromRow(data);
}

export async function sbUpsertViagemLocalizacao(l: ViagemLocalizacao): Promise<ViagemLocalizacao> {
  const { data, error } = await client()
    .from("viagem_localizacoes")
    .upsert(viagemLocalizacaoToRow(l))
    .select()
    .single();
  if (error) lancarErroSupabase(error);
  return viagemLocalizacaoFromRow(data);
}

export async function sbNextViagemNumero(transportadoraId: UUID): Promise<number> {
  const { data, error } = await client()
    .from("viagens")
    .select("numero_viagem")
    .eq("transportadora_id", transportadoraId)
    .order("numero_viagem", { ascending: false })
    .limit(1);
  if (error) lancarErroSupabase(error);
  const max = data?.[0]?.numero_viagem ?? 0;
  return max + 1;
}

export async function sbCountViagens(tenantId: UUID): Promise<number> {
  const { count, error } = await client()
    .from("viagens")
    .select("*", { count: "exact", head: true })
    .eq("transportadora_id", tenantId);
  if (error) lancarErroSupabase(error);
  return count ?? 0;
}
