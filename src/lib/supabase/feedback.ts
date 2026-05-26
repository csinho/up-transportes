import { getSupabaseClient } from "@/lib/supabase/client";
import { uploadFeedbackAnexo } from "@/lib/supabase/storage";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";
import type {
  FeedbackAnexo,
  FeedbackImpacto,
  FeedbackReport,
  FeedbackStatus,
  PlatformFeedbackResumo,
} from "@/types";

export type EnviarFeedbackInput = {
  transportadoraId: string;
  titulo: string;
  descricao: string;
  impacto: FeedbackImpacto;
  userEmail?: string;
  userNome?: string;
  paginaUrl?: string;
  userAgent?: string;
  anexos: Array<{
    file: File;
    tipo: "arquivo" | "gravacao";
    duracaoSegundos?: number;
  }>;
};

export async function enviarFeedbackReport(input: EnviarFeedbackInput): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: report, error: insertError } = await supabase
    .from("feedback_reports")
    .insert({
      transportadora_id: input.transportadoraId,
      user_id: user.id,
      user_email: input.userEmail ?? user.email ?? null,
      user_nome: input.userNome ?? null,
      titulo: input.titulo.trim(),
      descricao: input.descricao.trim(),
      impacto: input.impacto,
      pagina_url: input.paginaUrl ?? null,
      user_agent: input.userAgent ?? null,
    })
    .select("id")
    .single();

  if (insertError) lancarErroSupabase(insertError, "Falha ao enviar feedback");

  const feedbackId = report.id as string;

  for (const anexo of input.anexos) {
    const { path } = await uploadFeedbackAnexo({
      transportadoraId: input.transportadoraId,
      feedbackId,
      file: anexo.file,
    });

    const { error: anexoError } = await supabase.from("feedback_anexos").insert({
      feedback_id: feedbackId,
      storage_path: path,
      nome_arquivo: anexo.file.name,
      mime_type: anexo.file.type || null,
      tamanho_bytes: anexo.file.size,
      tipo: anexo.tipo,
      duracao_segundos: anexo.duracaoSegundos ?? null,
    });

    if (anexoError) lancarErroSupabase(anexoError, "Falha ao salvar anexo");
  }

  return feedbackId;
}

export async function listPlatformFeedback(
  transportadoraId: string,
): Promise<PlatformFeedbackResumo[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("list_platform_feedback", {
    p_transportadora_id: transportadoraId,
  });
  if (error) lancarErroSupabase(error);
  return (data ?? []) as PlatformFeedbackResumo[];
}

export async function getPlatformFeedback(id: string): Promise<FeedbackReport> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.rpc("get_platform_feedback", { p_id: id });
  if (error) lancarErroSupabase(error);
  const raw = data as FeedbackReport & { anexos?: FeedbackAnexo[] };
  return {
    ...raw,
    anexos: Array.isArray(raw.anexos) ? raw.anexos : [],
  };
}

export async function updatePlatformFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { error } = await supabase.rpc("update_platform_feedback_status", {
    p_id: id,
    p_status: status,
  });
  if (error) lancarErroSupabase(error);
}

export type { FeedbackAnexo };
