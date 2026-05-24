import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";
import type { UUID } from "@/types";

export type TransportadoraBranding = {
  id: UUID;
  nome_fantasia: string;
  logo_url?: string;
};

type BrandingRow = {
  id: UUID;
  nome_fantasia: string;
  logo_url: string | null;
};

export async function fetchTransportadoraBranding(
  transportadoraId: UUID,
): Promise<TransportadoraBranding | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_transportadora_branding", {
    p_id: transportadoraId,
  });
  if (error) lancarErroSupabase(error);

  const row = (data as BrandingRow[] | null)?.[0];
  if (!row) return null;

  return {
    id: row.id,
    nome_fantasia: row.nome_fantasia,
    logo_url: row.logo_url ?? undefined,
  };
}
