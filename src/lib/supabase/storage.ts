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
