import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useAuthSession } from "@/hooks/use-auth-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function ErpUserMenu() {
  const { user } = useAuthSession();
  const navigate = useNavigate();

  if (!isSupabaseConfigured() || !user) return null;

  const sair = async () => {
    try {
      await signOut();
      void navigate({ to: "/login", replace: true });
    } catch (err) {
      toast.error(traduzirErroSupabase(err, "Não foi possível sair"));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[160px]">
        {user.email}
      </span>
      <Button variant="ghost" size="icon" onClick={() => void sair()} aria-label="Sair">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
