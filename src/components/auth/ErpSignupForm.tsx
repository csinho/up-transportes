import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpColaborador } from "@/hooks/use-auth-session";
import { aceitarConvitesPendentes, emailPodeCadastrarColaborador } from "@/lib/supabase/colaboradores";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { toast } from "sonner";

type Props = {
  onSuccess?: () => void;
  /** Após cadastro sem sessão imediata (confirmação de e-mail). */
  onNeedsConfirmation?: (email: string) => void;
};

export function ErpSignupForm({ onSuccess, onNeedsConfirmation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const pode = await emailPodeCadastrarColaborador(email);
      if (!pode) {
        setError(
          "Este e-mail não possui convite pendente. Peça ao administrador da transportadora para convidá-lo.",
        );
        return;
      }

      const result = await signUpColaborador(email, password);

      if (result.needsEmailConfirmation) {
        toast.success("Conta criada! Confirme o e-mail para entrar.");
        onNeedsConfirmation?.(email.trim());
        return;
      }

      await aceitarConvitesPendentes();

      toast.success("Conta criada! Entrando…");
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
      onSubmit={(e) => void cadastrar(e)}
      className="space-y-5 rounded-xl border bg-card p-6 shadow-sm"
    >
      <p className="text-sm text-muted-foreground">
        Foi convidado pela transportadora? Use o <strong>mesmo e-mail do convite</strong> e crie
        a senha que vai usar daqui em diante.
      </p>

      <div className="space-y-2">
        <Label htmlFor="signup-email">E-mail do convite</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="nome@empresa.com.br"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={disabled}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Criar senha</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={disabled}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirmar senha</Label>
        <Input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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

      <Button type="submit" className="w-full h-11 text-base" disabled={disabled}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )}
        Criar conta e entrar
      </Button>
    </form>
  );
}
