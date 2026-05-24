import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "@/hooks/use-auth-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";

type Props = {
  redirectTo?: string;
  onSuccess?: () => void;
};

export function ErpLoginForm({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      onSuccess?.();
    } catch (err) {
      setError(traduzirErroSupabase(err));
    } finally {
      setLoading(false);
    }
  };

  const disabled = !isSupabaseConfigured() || loading;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-5 rounded-xl border bg-card p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={disabled}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={disabled}
          className="h-11"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2" role="alert">
          {error}
        </p>
      )}
      {!isSupabaseConfigured() && (
        <p className="text-xs text-muted-foreground">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local
        </p>
      )}
      <Button type="submit" className="w-full h-11 text-base" disabled={disabled}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogIn className="h-4 w-4 mr-2" />
        )}
        Entrar
      </Button>
    </form>
  );
}
