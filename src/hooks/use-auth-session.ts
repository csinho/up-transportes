import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { lancarErroSupabase } from "@/lib/supabase/traduzir-erro";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
};

export function useAuthSession(): AuthState {
  const [state, setState] = useState<AuthState>(() => ({
    loading: isSupabaseConfigured(),
    session: null,
    user: null,
  }));

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setState({ loading: false, session: null, user: null });
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({
        loading: false,
        session: data.session,
        user: data.session?.user ?? null,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({
        loading: false,
        session,
        user: session?.user ?? null,
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) lancarErroSupabase(error);
}

export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) lancarErroSupabase(error);
}
