import { useEffect, useState } from "react";
import { Copy, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { MotoristaAppQrDialog } from "@/components/layout/MotoristaAppQrDialog";
import { useActiveTenantId } from "@/data/store";
import { motoristaAppUrl } from "@/lib/motorista-tenant";

function getMotoristaAppUrl(transportadoraId?: string): string {
  if (typeof window === "undefined") {
    return transportadoraId ? `/motorista?t=${transportadoraId}` : "/motorista";
  }
  return motoristaAppUrl(transportadoraId);
}

/** Copia o link e exibe QR Code do PWA (/motorista) para motoristas. */
export function MotoristaAppLinkCopy() {
  const tenantId = useActiveTenantId();
  const [url, setUrl] = useState("/motorista");
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    setUrl(getMotoristaAppUrl(tenantId || undefined));
  }, [tenantId]);

  const copiar = () => {
    const link = getMotoristaAppUrl(tenantId || undefined);

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
    <>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" onClick={copiar}>
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">App motorista</span>
                <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs break-all">
              <p className="text-xs font-medium mb-1">Copiar link para motoristas</p>
              <p className="text-xs text-muted-foreground">{url}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setQrOpen(true)}
                aria-label="QR Code app motorista"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">QR Code com logo da transportadora</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <MotoristaAppQrDialog open={qrOpen} onOpenChange={setQrOpen} />
    </>
  );
}
