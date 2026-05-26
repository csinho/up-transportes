import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Flag, X } from "lucide-react";

export type FinalizarViagemPayload = {
  observacao?: string;
  fotos: File[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroViagem: number;
  onConfirm: (payload: FinalizarViagemPayload) => void;
  loading?: boolean;
};

export function MotoristaFinalizarSheet({
  open,
  onOpenChange,
  numeroViagem,
  onConfirm,
  loading,
}: Props) {
  const [obs, setObs] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setObs("");
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFotos([]);
    setPreviews([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const adicionarFotos = (files: FileList | null) => {
    if (!files?.length) return;
    const novas = Array.from(files);
    setFotos((prev) => [...prev, ...novas]);
    setPreviews((prev) => [...prev, ...novas.map((f) => URL.createObjectURL(f))]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removerFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Finalizar viagem #{String(numeroViagem).padStart(5, "0")}
          </SheetTitle>
          <SheetDescription>
            Confirme a entrega concluída. Você pode anexar fotos de canhotos e documentos da entrega.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="obs-finalizar">Observação (opcional)</Label>
            <Textarea
              id="obs-finalizar"
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex.: Entrega no doca 3, canhoto assinado…"
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos da entrega (opcional)</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => adicionarFotos(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              <Camera className="h-4 w-4 mr-2" />
              {fotos.length > 0 ? "Adicionar mais fotos" : "Tirar ou selecionar fotos"}
            </Button>
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={url} alt={fotos[i]?.name ?? `Foto ${i + 1}`} className="object-cover w-full h-full" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                      onClick={() => removerFoto(i)}
                      disabled={loading}
                      aria-label="Remover foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Canhotos, comprovantes e demais documentos ficam salvos na viagem para a transportadora.
            </p>
          </div>
        </div>
        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onConfirm({ observacao: obs.trim() || undefined, fotos });
              reset();
            }}
            disabled={loading}
          >
            Confirmar entrega
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
