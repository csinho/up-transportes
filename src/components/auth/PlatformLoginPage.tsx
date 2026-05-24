import { Link } from "@tanstack/react-router";
import { Shield, Truck } from "lucide-react";
import { ErpLoginForm } from "@/components/auth/ErpLoginForm";
import { Button } from "@/components/ui/button";

type Props = {
  redirectTo: string;
  onSuccess: () => void;
};

export function PlatformLoginPage({ redirectTo, onSuccess }: Props) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-violet-400 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-lg leading-none">Plataforma SaaS</p>
            <p className="text-xs text-slate-300 mt-1">Administração central</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
            Gestão de transportadoras e assinaturas
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Crie tenants, acompanhe planos, ative ou suspenda transportadoras. Acesso exclusivo para
            super-administradores.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-indigo-300" />
              Provisionamento de novas transportadoras
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0 text-indigo-300" />
              Monitoramento de uso e status
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 bg-background">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Plataforma SaaS</p>
              <p className="text-xs text-muted-foreground">Super-admin</p>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entrar na plataforma</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Use sua conta de super-administrador. Não é o login das transportadoras.
            </p>
          </div>

          <ErpLoginForm redirectTo={redirectTo} onSuccess={onSuccess} />

          <div className="pt-2 border-t space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              É operador de uma transportadora?
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/login">Ir para login do ERP</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
