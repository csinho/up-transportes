import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nome: string;
  email: string;
  isPending?: boolean;
  onConfirm: () => void;
};

function normalizarEmail(value: string) {
  return value.trim().toLowerCase();
}

export function RemoverColaboradorDialog({
  open,
  onOpenChange,
  nome,
  email,
  isPending,
  onConfirm,
}: Props) {
  const [confirmacao, setConfirmacao] = useState("");
  const emailAlvo = normalizarEmail(email);
  const emailConfere = normalizarEmail(confirmacao) === emailAlvo;

  useEffect(() => {
    if (!open) setConfirmacao("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{nome}</strong> perderá o acesso ao ERP desta
                transportadora. Esta ação não pode ser desfeita aqui — será necessário convidar
                novamente.
              </p>
              <p>
                Para confirmar, digite o e-mail do colaborador:{" "}
                <strong className="text-foreground font-mono text-xs">{email}</strong>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="confirmar-email-colaborador">E-mail do colaborador</Label>
          <Input
            id="confirmar-email-colaborador"
            type="email"
            autoComplete="off"
            placeholder={email}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && emailConfere && !isPending) onConfirm();
            }}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!emailConfere || isPending}
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover colaborador"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
