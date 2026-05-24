import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadTransportadoraLogo, removeDocumento } from "@/lib/supabase/storage";
import { isHttpLogoUrl, resolveLogoUrl } from "@/lib/logo-url";

type Props = {
  transportadoraId: string;
  entidadeId: string;
  logoUrl?: string;
  onChange: (logoUrl: string | undefined) => void;
};

export function TransportadoraLogoUpload({
  transportadoraId,
  entidadeId,
  logoUrl,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!logoUrl?.trim()) {
        setPreview(null);
        return;
      }
      if (isHttpLogoUrl(logoUrl)) {
        setPreview(logoUrl);
        return;
      }
      try {
        const url = await resolveLogoUrl(logoUrl);
        if (!cancelled) setPreview(url);
      } catch {
        if (!cancelled) setPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  const enviar = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (PNG, JPG, SVG…).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5 MB.");
      return;
    }

    setCarregando(true);
    void (async () => {
      try {
        const oldPath = logoUrl && !isHttpLogoUrl(logoUrl) ? logoUrl : undefined;
        const { path } = await uploadTransportadoraLogo({
          transportadoraId,
          entidadeId,
          file,
        });
        onChange(path);
        setPreview(URL.createObjectURL(file));
        if (oldPath && oldPath !== path) {
          try {
            await removeDocumento(oldPath);
          } catch {
            /* ignora */
          }
        }
        toast.success("Logo enviada!");
      } catch {
        toast.error("Não foi possível enviar a logo.");
      } finally {
        setCarregando(false);
      }
    })();
  };

  const remover = () => {
    const path = logoUrl && !isHttpLogoUrl(logoUrl) ? logoUrl : undefined;
    onChange(undefined);
    setPreview(null);
    if (path) {
      void removeDocumento(path).catch(() => undefined);
    }
    toast.success("Logo removida.");
  };

  return (
    <div className="space-y-3">
      <Label>Logo da transportadora</Label>
      <p className="text-xs text-muted-foreground">
        Usada no QR Code do app motorista, PDFs e relatórios.
      </p>

      <div className="flex flex-wrap items-start gap-4">
        <div className="h-24 w-24 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
          {carregando ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : preview ? (
            <img src={preview} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) enviar(file);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={carregando}
            onClick={() => inputRef.current?.click()}
          >
            {carregando ? "Enviando…" : "Buscar imagem no PC"}
          </Button>
          {preview && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={remover}>
              <Trash2 className="h-4 w-4 mr-1" />
              Remover logo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
