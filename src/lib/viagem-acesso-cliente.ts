import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseClient } from "@/lib/supabase/client";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";
import type { Viagem, ViagemLocalizacao, UUID } from "@/types";
import { viagemFromRow } from "@/lib/supabase/mappers";

export type AcessoClienteResumo = {
  token: UUID;
  titulo: string | null;
  ativo: boolean;
  created_at: string;
};

export type AcompanhamentoClientePayload = {
  valido: boolean;
  token?: UUID;
  transportadora?: { nome_fantasia: string; logo_url?: string };
  viagem?: Viagem;
  cliente_origem_nome?: string;
  cliente_destino_nome?: string;
  localizacoes?: ViagemLocalizacao[];
};

type RpcAcompanhamento = {
  valido: boolean;
  token?: string;
  transportadora?: { nome_fantasia: string; logo_url?: string | null };
  viagem?: {
    id: string;
    transportadora_id: string;
    numero_viagem: number;
    status: string;
    dados: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  };
  cliente_origem_nome?: string;
  cliente_destino_nome?: string;
  localizacoes?: Array<{
    latitude: number;
    longitude: number;
    velocidade_kmh?: number;
    registrado_em: string;
  }>;
};

export async function criarAcessoClienteViagem(
  viagemId: UUID,
  titulo?: string,
): Promise<{ token: UUID; created_at: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("criar_acesso_cliente_viagem", {
    p_viagem_id: viagemId,
    p_titulo: titulo ?? null,
  });
  if (error) lancarErroSupabase(error);

  const row = (data as { token: UUID; created_at: string }[] | null)?.[0];
  if (!row) throw new Error("Falha ao gerar link");
  return row;
}

export async function revogarAcessoCliente(token: UUID): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { error } = await supabase.rpc("revogar_acesso_cliente_viagem", { p_token: token });
  if (error) lancarErroSupabase(error);
}

export async function listAcessosClienteViagem(viagemId: UUID): Promise<AcessoClienteResumo[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("list_acessos_cliente_viagem", {
    p_viagem_id: viagemId,
  });
  if (error) lancarErroSupabase(error);
  return (data ?? []) as AcessoClienteResumo[];
}

export async function fetchAcompanhamentoCliente(token: string): Promise<AcompanhamentoClientePayload> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const tokenNorm = token.trim();
  if (!tokenNorm) return { valido: false };

  const { data, error } = await supabase.rpc("get_acompanhamento_cliente", {
    p_token: tokenNorm,
  });
  if (error) {
    console.error("[acompanhar] RPC get_acompanhamento_cliente:", error);
    lancarErroSupabase(error);
  }

  const parsed =
    typeof data === "string"
      ? (JSON.parse(data) as RpcAcompanhamento)
      : (data as RpcAcompanhamento | null);

  const raw = parsed;
  if (!raw?.valido || !raw.viagem) {
    return { valido: false };
  }

  const viagem = viagemFromRow({
    id: raw.viagem.id,
    transportadora_id: raw.viagem.transportadora_id,
    numero_viagem: raw.viagem.numero_viagem,
    status: raw.viagem.status,
    dados: raw.viagem.dados as Json,
    created_at: raw.viagem.created_at,
    updated_at: raw.viagem.updated_at,
  });

  const localizacoes: ViagemLocalizacao[] = (raw.localizacoes ?? []).map((l, i) => ({
    id: `cliente-loc-${i}`,
    transportadora_id: viagem.transportadora_id,
    viagem_id: viagem.id,
    latitude: l.latitude,
    longitude: l.longitude,
    velocidade_kmh: l.velocidade_kmh,
    registrado_em: l.registrado_em,
    created_at: l.registrado_em,
  }));

  return {
    valido: true,
    token: raw.token,
    transportadora: {
      nome_fantasia: raw.transportadora?.nome_fantasia ?? "Transportadora",
      logo_url: raw.transportadora?.logo_url ?? undefined,
    },
    viagem,
    cliente_origem_nome: raw.cliente_origem_nome,
    cliente_destino_nome: raw.cliente_destino_nome,
    localizacoes,
  };
}
