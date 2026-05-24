import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Route, ShieldCheck, Truck } from "lucide-react";
import { TransportadoraLogo } from "@/components/transportadora/TransportadoraLogo";
import { ErpLoginForm } from "@/components/auth/ErpLoginForm";
import { ErpSignupForm } from "@/components/auth/ErpSignupForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { UUID } from "@/types";

type Props = {
  transportadoraId?: UUID;
  redirectTo: string;
  onSuccess: () => void;
};

export function ErpLoginPage({ transportadoraId, redirectTo, onSuccess }: Props) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-sky-400 blur-3xl" />
        </div>

        <div className="relative z-10">
          <TransportadoraLogo
            transportadoraId={transportadoraId}
            size="lg"
            showName
            sessionMode="none"
            className="border-white/20 bg-white/10 [&_img]:brightness-110"
            nameClassName="text-white text-xl"
          />
        </div>

        <div className="relative z-10 space-y-8 max-w-md">
          <div>
            <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
              Operação de viagens, do escritório à estrada
            </h2>
            <p className="mt-4 text-slate-200/90 text-base leading-relaxed">
              Gerencie fretes, motoristas, rastreamento e auditoria em um só lugar — com a cara da
              sua transportadora.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: Route, text: "Viagens e rastreamento em tempo real" },
              { icon: ShieldCheck, text: "Auditoria e histórico de eventos" },
              { icon: Truck, text: "App do motorista integrado" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-100/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          ERP Transportadora · Acesso exclusivo para colaboradores autorizados
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 bg-background">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="lg:hidden flex flex-col items-center text-center gap-4">
            <TransportadoraLogo
              transportadoraId={transportadoraId}
              size="lg"
              showName
              sessionMode="none"
            />
          </div>

          {confirmEmail ? (
            <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm text-center">
              <h1 className="text-xl font-bold">Confirme seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmação para <strong>{confirmEmail}</strong>. Abra o
                e-mail, confirme a conta e depois volte aqui em <strong>Entrar</strong> com a senha
                que você criou.
              </p>
              <Button
                onClick={() => {
                  setConfirmEmail(null);
                  setTab("login");
                }}
              >
                Ir para entrar
              </Button>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Primeiro acesso</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6 space-y-2">
                <p className="text-sm text-muted-foreground">Já tem conta? Use seu e-mail e senha.</p>
                <ErpLoginForm redirectTo={redirectTo} onSuccess={onSuccess} />
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <ErpSignupForm onSuccess={onSuccess} onNeedsConfirmation={setConfirmEmail} />
              </TabsContent>
            </Tabs>
          )}

          <div className="pt-4 border-t text-center space-y-3">
            <p className="text-xs text-muted-foreground">É motorista?</p>
            <Link
              to="/motorista"
              search={transportadoraId ? { t: transportadoraId } : {}}
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <Truck className="h-4 w-4" />
              Acessar app do motorista
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
