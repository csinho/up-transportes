import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { getViagemStatusStyle } from "@/lib/viagem-status-styles";
import type { StatusViagem } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  status: StatusViagem | string;
  children: ReactNode;
  className?: string;
  /** Barra colorida à esquerda (listas) */
  accent?: boolean;
};

/** Card com fundo/borda na cor do status da viagem. */
export function ViagemStatusCard({ status, children, className, accent }: Props) {
  const style = getViagemStatusStyle(status);
  return (
    <Card
      className={cn(
        "border-2 shadow-sm",
        style.card,
        accent && cn("border-l-4", style.accent),
        className,
      )}
    >
      {children}
    </Card>
  );
}
