import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  children: React.ReactNode;
};

/** Bloqueia o app quando Supabase não está configurado. */
export function SupabaseRequired({ children }: Props) {
  if (isSupabaseConfigured()) return children;

  const isProd = import.meta.env.PROD;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-xl font-semibold">Supabase obrigatório</h1>
        {isProd ? (
          <p className="text-sm text-muted-foreground">
            As variáveis{" "}
            <code className="text-xs bg-muted px-1 rounded">VITE_SUPABASE_URL</code> e{" "}
            <code className="text-xs bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code> precisam
            estar nas <strong>Build variables</strong> da Cloudflare (não só em runtime) e o projeto
            precisa ser reconstruído. Use o build command{" "}
            <code className="text-xs bg-muted px-1 rounded">npm ci &amp;&amp; npm run build</code>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este ERP não usa mais dados locais mockados. Copie{" "}
            <code className="text-xs bg-muted px-1 rounded">.env.example</code> para{" "}
            <code className="text-xs bg-muted px-1 rounded">.env.local</code>, preencha URL e anon
            key, e aplique as migrations em{" "}
            <code className="text-xs bg-muted px-1 rounded">supabase/migrations</code>.
          </p>
        )}
      </div>
    </div>
  );
}
