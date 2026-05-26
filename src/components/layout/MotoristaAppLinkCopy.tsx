import { useState } from "react";
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
import { useActiveTenantId, useTransportadoras } from "@/data/store";
import {
  buildMotoristaAppAbsoluteUrl,
  resolveErpMotoristaTenantId,
} from "@/lib/motorista-tenant";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

/** Copia o link e exibe QR Code do PWA (/motorista) para motoristas. */
export function MotoristaAppLinkCopy() {
  const tenantId = useActiveTenantId();
  const { data: transportadoras = [] } = useTransportadoras();
  const [qrOpen, setQrOpen] = useState(false);

  const copiar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const tid = resolveErpMotoristaTenantId(tenantId, transportadoras[0]?.id);
    if (!tid) {
      toast.error("Transportadora ainda não carregada. Aguarde um instante e tente de novo.");
      return;
    }

    const link = buildMotoristaAppAbsoluteUrl(tid);

    void (async () => {
      const ok = await copyTextToClipboard(link);
      if (ok) {
        toast.success("Link copiado! Envie para o motorista instalar o app.", {
          description: link,
        });
      } else {
        toast.error("Não foi possível copiar automaticamente.", {
          description: link,
        });
      }
    })();
  };

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={copiar}
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">App motorista</span>
                <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-white">
              Copiar link para motoristas
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
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
