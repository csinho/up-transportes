import { getSupabaseClient } from "@/lib/supabase/client";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";
import type { UUID } from "@/types";

export type ColaboradorRole = "owner" | "operador";

export type Colaborador = {
  registro_id: string;
  user_id: UUID | null;
  email: string;
  nome: string;
  role: ColaboradorRole;
  status: "ativo" | "pendente";
  created_at: string;
};

export const COLABORADOR_ROLES: { value: ColaboradorRole; label: string; descricao: string }[] = [
  { value: "owner", label: "Proprietário", descricao: "Acesso total, inclui gerenciar colaboradores" },
  { value: "operador", label: "Operador", descricao: "Operação diária: viagens, cadastros e rastreamento" },
];

export const COLABORADOR_INVITE_ROLES = COLABORADOR_ROLES;

/** Fallback se a RPC falhar (ex.: migration ainda não aplicada). */
async function listColaboradoresFallback(transportadoraId: UUID): Promise<Colaborador[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const [membrosRes, convitesRes] = await Promise.all([
    supabase
      .from("user_transportadoras")
      .select("user_id, role, created_at")
      .eq("transportadora_id", transportadoraId),
    supabase
      .from("transportadora_convites")
      .select("id, email, role, created_at")
      .eq("transportadora_id", transportadoraId),
  ]);

  if (membrosRes.error) lancarErroSupabase(membrosRes.error);
  if (convitesRes.error) lancarErroSupabase(convitesRes.error);

  const userIds = (membrosRes.data ?? []).map((m) => m.user_id);
  let profilesById = new Map<string, { nome?: string; email?: string }>();

  if (userIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, nome, email")
      .in("id", userIds);
    if (profErr) lancarErroSupabase(profErr);
    profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));
  }

  const ativos: Colaborador[] = (membrosRes.data ?? []).map((m) => {
    const p = profilesById.get(m.user_id);
    const email = p?.email ?? "";
    return {
      registro_id: m.user_id,
      user_id: m.user_id,
      email,
      nome: p?.nome ?? (email ? email.split("@")[0] : "Colaborador"),
      role: m.role as ColaboradorRole,
      status: "ativo",
      created_at: m.created_at,
    };
  });

  const pendentes: Colaborador[] = (convitesRes.data ?? []).map((c) => ({
    registro_id: `convite:${c.id}`,
    user_id: null,
    email: c.email,
    nome: c.email.split("@")[0] ?? c.email,
    role: c.role as ColaboradorRole,
    status: "pendente",
    created_at: c.created_at,
  }));

  return [...ativos, ...pendentes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function listColaboradores(transportadoraId: UUID): Promise<Colaborador[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("list_transportadora_colaboradores", {
    p_tid: transportadoraId,
  });

  if (error) {
    console.warn("[Colaboradores] RPC falhou, usando fallback:", error.message);
    return listColaboradoresFallback(transportadoraId);
  }

  return (data ?? []) as Colaborador[];
}

export async function convidarColaborador(
  transportadoraId: UUID,
  email: string,
  role: ColaboradorRole,
): Promise<"ativo" | "pendente"> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("convidar_colaborador", {
    p_tid: transportadoraId,
    p_email: email.trim(),
    p_role: role,
  });
  if (error) lancarErroSupabase(error);
  return data as "ativo" | "pendente";
}

export async function atualizarColaboradorRole(
  transportadoraId: UUID,
  userId: UUID,
  role: ColaboradorRole,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { error } = await supabase.rpc("atualizar_colaborador_role", {
    p_tid: transportadoraId,
    p_user_id: userId,
    p_role: role,
  });
  if (error) lancarErroSupabase(error);
}

export async function removerColaborador(
  transportadoraId: UUID,
  registroId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { error } = await supabase.rpc("remover_colaborador", {
    p_registro_id: registroId,
    p_tid: transportadoraId,
  });
  if (error) lancarErroSupabase(error);
}

export async function aceitarConvitesPendentes(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc("aceitar_convites_pendentes");
  if (error) {
    console.warn("[Supabase] Falha ao aceitar convites:", error.message);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

/** Verifica se o e-mail tem convite pendente (pode criar conta). */
export async function emailPodeCadastrarColaborador(email: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("email_pode_cadastrar_colaborador", {
    p_email: email.trim(),
  });
  if (error) {
    console.warn("[Colaboradores] Falha ao verificar convite:", error.message);
    return false;
  }
  return !!data;
}

export async function getUserTenantRole(transportadoraId: UUID): Promise<ColaboradorRole | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("user_tenant_role", { tid: transportadoraId });
  if (error) {
    const { data: row } = await supabase
      .from("user_transportadoras")
      .select("role")
      .eq("transportadora_id", transportadoraId)
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle();
    return (row?.role as ColaboradorRole) ?? null;
  }
  return (data as ColaboradorRole) ?? null;
}
