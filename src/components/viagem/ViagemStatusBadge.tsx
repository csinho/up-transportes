import { Badge } from "@/components/ui/badge";
import { getViagemStatusStyle } from "@/lib/viagem-status-styles";
import type { StatusViagem } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  status: StatusViagem | string;
  className?: string;
  size?: "sm" | "default";
};

export function ViagemStatusBadge({ status, className, size = "default" }: Props) {
  const style = getViagemStatusStyle(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        style.badge,
        "font-semibold shadow-none hover:opacity-90",
        size === "sm" && "text-[10px] px-2 py-0",
        className,
      )}
    >
      {style.label}
    </Badge>
  );
}
