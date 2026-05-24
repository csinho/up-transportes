import { useState } from "react";
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
import { Flag } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroViagem: number;
  onConfirm: (observacao?: string) => void;
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

  const handleOpenChange = (next: boolean) => {
    if (!next) setObs("");
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Finalizar viagem #{String(numeroViagem).padStart(5, "0")}
          </SheetTitle>
          <SheetDescription>
            Confirme a entrega concluída. A transportadora será notificada automaticamente.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="obs-finalizar">Observação (opcional)</Label>
          <Textarea
            id="obs-finalizar"
            rows={3}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Ex.: Entrega no doca 3, canhoto assinado…"
          />
        </div>
        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              onConfirm(obs.trim() || undefined);
              setObs("");
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
