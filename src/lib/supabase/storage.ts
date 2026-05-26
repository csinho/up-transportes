import { getSupabaseClient } from "@/lib/supabase/client";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";

const BUCKET = "documentos";

export type UploadDocumentoInput = {
  transportadoraId: string;
  entidade: "viagens" | "transportadoras" | "motoristas" | "veiculos";
  entidadeId: string;
  file: File;
};

/** Upload para Supabase Storage (bucket privado `documentos`). */
export async function uploadDocumento({
  transportadoraId,
  entidade,
  entidadeId,
  file,
}: UploadDocumentoInput): Promise<{ path: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${transportadoraId}/${entidade}/${entidadeId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) lancarErroSupabase(error, "Falha ao enviar arquivo");
  return { path };
}

export async function getDocumentoSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) lancarErroSupabase(error, "Falha ao abrir arquivo");
  return data.signedUrl;
}

export async function removeDocumento(path: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) lancarErroSupabase(error, "Falha ao remover arquivo");
}

/** Logo da transportadora — substitui arquivo anterior. */
export async function uploadTransportadoraLogo(input: {
  transportadoraId: string;
  entidadeId: string;
  file: File;
}): Promise<{ path: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const ext = input.file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${input.transportadoraId}/transportadoras/${input.entidadeId}/logo.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    cacheControl: "3600",
    upsert: true,
    contentType: input.file.type || undefined,
  });

  if (error) lancarErroSupabase(error, "Falha ao enviar logo");
  return { path };
}

export const FEEDBACK_MAX_FILE_BYTES = 104_857_600; // 100 MB
export const FEEDBACK_MAX_ANEXOS = 5;

/** Upload de anexo de feedback (bucket privado `documentos`). */
export async function uploadFeedbackAnexo(input: {
  transportadoraId: string;
  feedbackId: string;
  file: File;
}): Promise<{ path: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const safeName = input.file.name.replace(/[^\w.-]+/g, "_");
  const path = `${input.transportadoraId}/feedback/${input.feedbackId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, input.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: input.file.type || undefined,
  });

  if (error) lancarErroSupabase(error, "Falha ao enviar anexo");
  return { path };
}
