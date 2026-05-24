import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  children: React.ReactNode;
};

/** Bloqueia o app quando Supabase não está configurado. */
export function SupabaseRequired({ children }: Props) {
  if (isSupabaseConfigured()) return children;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-semibold">Supabase obrigatório</h1>
        <p className="text-sm text-muted-foreground">
          Este ERP não usa mais dados locais mockados. Copie{" "}
          <code className="text-xs bg-muted px-1 rounded">.env.example</code> para{" "}
          <code className="text-xs bg-muted px-1 rounded">.env.local</code>, preencha URL e anon key,
          e aplique as migrations em <code className="text-xs bg-muted px-1 rounded">supabase/migrations</code>.
        </p>
      </div>
    </div>
  );
}
