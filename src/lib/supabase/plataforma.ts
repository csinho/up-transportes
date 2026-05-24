import { getSupabaseClient } from "@/lib/supabase/client";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";

export type PlanoTransportadora = "trial" | "basico" | "profissional";

export type PlatformTransportadoraResumo = {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string | null;
  ativa: boolean;
  plano: PlanoTransportadora;
  trial_ate: string | null;
  created_at: string;
  total_colaboradores: number;
  total_viagens: number;
  owner_email: string | null;
};

export type PlatformColaboradorResumo = {
  user_id: string | null;
  email: string;
  nome: string;
  role: string;
  status: "ativo" | "pendente";
  created_at: string;
};

export type PlatformTransportadoraDetalhe = {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string | null;
  email: string | null;
  telefone_principal: string | null;
  ativa: boolean;
  plano: PlanoTransportadora;
  trial_ate: string | null;
  motivo_suspensao: string | null;
  created_at: string;
  updated_at: string;
  total_viagens: number;
  total_motoristas: number;
  colaboradores: PlatformColaboradorResumo[];
};

export const PLANO_LABELS: Record<PlanoTransportadora, string> = {
  trial: "Trial",
  basico: "Básico",
  profissional: "Profissional",
};

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) {
    console.warn("[Plataforma] is_platform_admin:", error.message);
    return false;
  }
  return !!data;
}

export async function bootstrapFirstPlatformAdmin(): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("bootstrap_first_platform_admin");
  if (error) lancarErroSupabase(error);
  return !!data;
}

export async function listPlatformTransportadoras(): Promise<PlatformTransportadoraResumo[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("list_platform_transportadoras");
  if (error) lancarErroSupabase(error);
  return (data ?? []) as PlatformTransportadoraResumo[];
}

export async function getPlatformTransportadora(id: string): Promise<PlatformTransportadoraDetalhe | null> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("get_platform_transportadora", { p_id: id });
  if (error) lancarErroSupabase(error);
  if (!data) return null;
  return data as PlatformTransportadoraDetalhe;
}

export async function criarTransportadoraPlatform(input: {
  nome_fantasia: string;
  razao_social: string;
  owner_email: string;
  cnpj?: string;
  plano?: PlanoTransportadora;
}): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("criar_transportadora_platform", {
    p_nome_fantasia: input.nome_fantasia.trim(),
    p_razao_social: input.razao_social.trim(),
    p_owner_email: input.owner_email.trim(),
    p_cnpj: input.cnpj?.trim() || null,
    p_plano: input.plano ?? "trial",
  });
  if (error) lancarErroSupabase(error);
  return data as string;
}

export async function setTransportadoraAtiva(
  id: string,
  ativa: boolean,
  motivo?: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { error } = await supabase.rpc("set_transportadora_ativa", {
    p_id: id,
    p_ativa: ativa,
    p_motivo: motivo ?? null,
  });
  if (error) lancarErroSupabase(error);
}
