import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ErpLoginForm } from "@/components/auth/ErpLoginForm";
import { useAuthSession } from "@/hooks/use-auth-session";
import { z } from "zod";

const loginSearchSchema = z.object({
  redirect: z.string().optional().default("/"),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Entrar — ERP Transportadora" }],
  }),
  component: Page,
});

function Page() {
  const { redirect } = Route.useSearch();
  const { loading, session } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      void navigate({ to: redirect, replace: true });
    }
  }, [loading, session, redirect, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/30 gap-6">
      <ErpLoginForm onSuccess={() => void navigate({ to: redirect, replace: true })} />
      <p className="text-xs text-muted-foreground max-w-sm text-center">
        App motorista em <code>/motorista</code> — login por CPF (Supabase).
      </p>
    </div>
  );
}
