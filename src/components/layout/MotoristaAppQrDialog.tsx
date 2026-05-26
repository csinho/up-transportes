import { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActiveTenantId, useTransportadora, useTransportadoras } from "@/data/store";
import { logoToDataUrl } from "@/lib/logo-url";
import {
  buildMotoristaAppAbsoluteUrl,
  resolveErpMotoristaTenantId,
} from "@/lib/motorista-tenant";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MotoristaAppQrDialog({ open, onOpenChange }: Props) {
  const tenantId = useActiveTenantId();
  const { data: transportadoras = [] } = useTransportadoras();
  const resolvedTenantId = resolveErpMotoristaTenantId(tenantId, transportadoras[0]?.id);
  const { data: transportadora } = useTransportadora(resolvedTenantId);
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [gerando, setGerando] = useState(false);

  const url = buildMotoristaAppAbsoluteUrl(resolvedTenantId);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void (async () => {
      setGerando(true);
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled || !containerRef.current) {
        setGerando(false);
        return;
      }

      const logoDataUrl = await logoToDataUrl(transportadora?.logo_url);

      const options: ConstructorParameters<typeof QRCodeStyling>[0] = {
        width: 280,
        height: 280,
        type: "canvas",
        data: url,
        margin: 8,
        qrOptions: { errorCorrectionLevel: "H" },
        dotsOptions: { color: "#0f172a", type: "rounded" },
        cornersSquareOptions: { type: "extra-rounded", color: "#0f172a" },
        cornersDotOptions: { type: "dot", color: "#0f172a" },
        backgroundOptions: { color: "#ffffff" },
      };

      if (logoDataUrl) {
        options.image = logoDataUrl;
        options.imageOptions = {
          margin: 6,
          imageSize: 0.32,
          hideBackgroundDots: true,
        };
      }

      const qr = new QRCodeStyling(options);
      containerRef.current.innerHTML = "";
      qr.append(containerRef.current);
      qrRef.current = qr;
      setGerando(false);
    })();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
      qrRef.current = null;
    };
  }, [open, url, transportadora?.logo_url]);

  const copiarLink = () => {
    if (!resolvedTenantId) {
      toast.error("Transportadora ainda não carregada.");
      return;
    }
    void (async () => {
      const ok = await copyTextToClipboard(url);
      if (ok) {
        toast.success("Link copiado!", { description: url });
      } else {
        toast.error("Não foi possível copiar automaticamente.", { description: url });
      }
    })();
  };

  const baixarQr = () => {
    void qrRef.current?.download({
      name: `app-motorista-${transportadora?.nome_fantasia?.replace(/\s+/g, "-").toLowerCase() ?? "transportadora"}`,
      extension: "png",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code — App motorista</DialogTitle>
          <DialogDescription>
            Motoristas escaneiam para abrir o APP de rastreamento
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div className="relative w-[280px] h-[280px] rounded-lg border bg-white p-2 shadow-sm flex items-center justify-center overflow-hidden">
            {gerando && (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground absolute" />
            )}
            <div
              ref={containerRef}
              className="w-[280px] h-[280px] [&>canvas]:!w-full [&>canvas]:!h-full [&>canvas]:block"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full justify-center">
            <Button variant="outline" size="sm" onClick={copiarLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copiar link
            </Button>
            <Button variant="outline" size="sm" onClick={baixarQr} disabled={gerando}>
              <Download className="h-4 w-4 mr-1" />
              Baixar PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
