import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireSupabaseSession } from "@/lib/supabase/session";

export async function assertDataAccess(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local");
  }
  if (!(await requireSupabaseSession())) {
    throw new Error("Faça login para continuar.");
  }
}
