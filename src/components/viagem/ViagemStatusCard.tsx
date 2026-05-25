import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { getViagemStatusStyle } from "@/lib/viagem-status-styles";
import type { StatusViagem } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  status: StatusViagem | string;
  children: ReactNode;
  className?: string;
  /** Barra colorida na borda: `true` ou `"right"` = direita (motorista); `"left"` = esquerda */
  accent?: boolean | "left" | "right";
};

/** Card neutro com barra colorida opcional na borda. */
export function ViagemStatusCard({ status, children, className, accent }: Props) {
  const style = getViagemStatusStyle(status);
  const accentClass =
    accent === "left"
      ? style.accentLeft
      : accent === true || accent === "right"
        ? style.accentRight
        : undefined;

  return (
    <Card className={cn(style.card, accentClass, className)}>
      {children}
    </Card>
  );
}
