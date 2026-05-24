import { useEffect, useState } from "react";
import { Copy, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

function getMotoristaAppUrl(): string {
  if (typeof window === "undefined") return "/motorista";
  return `${window.location.origin}/motorista`;
}

/** Copia o link do PWA (/motorista) para enviar aos motoristas. */
export function MotoristaAppLinkCopy() {
  const [url, setUrl] = useState("/motorista");

  useEffect(() => {
    setUrl(getMotoristaAppUrl());
  }, []);

  const copiar = () => {
    const link = getMotoristaAppUrl();

    void (async () => {
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Link copiado! Envie para o motorista instalar o app.");
      } catch {
        toast.error(`Copie manualmente: ${link}`);
      }
    })();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[220px]" onClick={copiar}>
            <Smartphone className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline truncate">App motorista</span>
            <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs break-all">
          <p className="text-xs font-medium mb-1">Link para motoristas</p>
          <p className="text-xs text-muted-foreground">{url}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
