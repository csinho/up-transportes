import { Download, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { isSecureContextForPwa } from "@/lib/pwa-utils";

type Props = {
  /** Botão compacto no header */
  variant?: "button" | "card";
};

export function MotoristaInstalarPwa({ variant = "button" }: Props) {
  const { isIos, isStandalone, canPromptInstall, install } = usePwaInstall();

  if (isStandalone) return null;

  const secure = isSecureContextForPwa();

  const content = (
    <div className="space-y-4 text-sm">
      {!secure && (
        <p className="rounded-lg bg-amber-500/15 px-3 py-2 text-amber-900 dark:text-amber-100">
          A instalação só funciona em <strong>HTTPS</strong> (link seguro). Se estiver em preview
          HTTP, abra o app pelo endereço publicado com cadeado.
        </p>
      )}

      <p className="text-muted-foreground">
        Abra sempre pela rota <strong>/motorista</strong> antes de instalar — o atalho abre direto
        no app do motorista.
      </p>

      {isIos ? (
        <ol className="space-y-3 list-none pl-0">
          <li className="flex gap-3 items-start">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Share className="h-4 w-4" />
            </span>
            <span>
              No <strong>Safari</strong>, toque em <strong>Compartilhar</strong> (ícone na barra
              inferior).
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PlusSquare className="h-4 w-4" />
            </span>
            <span>
              Role e escolha <strong>Adicionar à Tela de Início</strong>. No iPhone o Safari não
              mostra um botão automático de “instalar app”.
            </span>
          </li>
        </ol>
      ) : canPromptInstall ? (
        <Button className="w-full" onClick={() => void install()}>
          <Download className="h-4 w-4 mr-2" />
          Instalar app
        </Button>
      ) : (
        <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
          <li>Use o <strong>Chrome</strong> ou <strong>Edge</strong> no Android.</li>
          <li>
            Menu <strong>⋮</strong> → <strong>Instalar app</strong> ou{" "}
            <strong>Adicionar à tela inicial</strong>.
          </li>
          <li>Se não aparecer, aguarde alguns segundos nesta página e tente de novo.</li>
        </ol>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Instalar na tela inicial</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isIos ? "Toque para ver como no iPhone" : "Atalho como app nativo"}
                </p>
              </div>
            </div>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Instalar App Motorista</SheetTitle>
            <SheetDescription>
              {isIos
                ? "No iPhone/iPad a instalação é feita pelo Safari."
                : "Adicione um atalho na tela inicial do celular."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 px-2.5">
          <Download className="h-3.5 w-3.5" />
          Instalar
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Instalar App Motorista</SheetTitle>
          <SheetDescription>Atalho na tela inicial para abrir sem o navegador.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 pb-6">{content}</div>
      </SheetContent>
    </Sheet>
  );
}
