import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  origem: string;
  destino: string;
  className?: string;
  compact?: boolean;
};

export function ViagemRouteLabel({ origem, destino, className, compact }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 min-w-0 max-w-full text-muted-foreground",
        compact ? "text-xs" : "text-sm",
        className,
      )}
    >
      <span className="truncate font-medium text-foreground/90">{origem}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-orange" aria-hidden />
      <span className="truncate font-medium text-foreground/90">{destino}</span>
    </span>
  );
}
