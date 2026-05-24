import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { PlatformLoginPage } from "@/components/auth/PlatformLoginPage";
import { useAuthSession } from "@/hooks/use-auth-session";
import { isPlatformAdmin } from "@/lib/supabase/plataforma";
import { toast } from "sonner";

const searchSchema = z.object({
  redirect: z.string().optional().default("/plataforma/transportadoras"),
});

export const Route = createFileRoute("/plataforma/login")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Entrar — Plataforma SaaS" }],
  }),
  component: Page,
});

function Page() {
  const { redirect } = Route.useSearch();
  const { loading, session } = useAuthSession();
  const navigate = useNavigate();

  const entrarSeSuperAdmin = async () => {
    const ok = await isPlatformAdmin();
    if (!ok) {
      toast.error("Esta conta não é super-admin da plataforma. Use o login do ERP (/login).");
      return;
    }
    void navigate({ to: redirect, replace: true });
  };

  useEffect(() => {
    if (!loading && session) {
      void entrarSeSuperAdmin();
    }
  }, [loading, session]);

  const handleSuccess = () => {
    void entrarSeSuperAdmin();
  };

  return <PlatformLoginPage redirectTo={redirect} onSuccess={handleSuccess} />;
}
