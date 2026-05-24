import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroViagem: number;
  onConfirm: (motivo: string) => void;
  loading?: boolean;
};

export function FinalizarViagemDialog({
  open,
  onOpenChange,
  numeroViagem,
  onConfirm,
  loading,
}: Props) {
  const [motivo, setMotivo] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setMotivo("");
    onOpenChange(next);
  };

  const confirmar = () => {
    const texto = motivo.trim();
    if (texto.length < 10) return;
    onConfirm(texto);
    setMotivo("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Finalizar viagem #{String(numeroViagem).padStart(5, "0")}
          </DialogTitle>
          <DialogDescription>
            O fluxo padrão é o motorista finalizar pelo aplicativo. Use esta opção apenas quando
            necessário — o motivo ficará registrado para auditoria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo-finalizacao">Motivo da finalização *</Label>
          <Textarea
            id="motivo-finalizacao"
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Cliente confirmou entrega por telefone; motorista sem sinal; acordo operacional…"
          />
          <p className="text-xs text-muted-foreground">Mínimo 10 caracteres.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={loading || motivo.trim().length < 10}>
            Confirmar finalização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
