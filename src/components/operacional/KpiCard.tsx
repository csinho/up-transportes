import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export type KpiAccent = "blue" | "orange" | "green" | "amber" | "red" | "navy";

const accentStyles: Record<
  KpiAccent,
  { border: string; iconBg: string; iconColor: string; value?: string }
> = {
  blue: {
    border: "border-t-brand-blue",
    iconBg: "bg-blue-100",
    iconColor: "text-brand-blue",
  },
  orange: {
    border: "border-t-brand-orange",
    iconBg: "bg-orange-100",
    iconColor: "text-brand-orange",
  },
  green: {
    border: "border-t-brand-success",
    iconBg: "bg-green-100",
    iconColor: "text-brand-success",
  },
  amber: {
    border: "border-t-brand-warning",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  red: {
    border: "border-t-brand-danger",
    iconBg: "bg-red-100",
    iconColor: "text-brand-danger",
  },
  navy: {
    border: "border-t-brand-navy",
    iconBg: "bg-slate-100",
    iconColor: "text-brand-navy",
  },
};

type Props = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  accent?: KpiAccent;
  alert?: boolean;
  className?: string;
};

export function KpiCard({ icon: Icon, label, value, accent = "blue", alert, className }: Props) {
  const styles = accentStyles[alert ? "amber" : accent];

  return (
    <Card
      className={cn(
        "border-t-4 overflow-hidden transition-shadow hover:shadow-md",
        styles.border,
        alert && "ring-1 ring-amber-200/80",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p
              className={cn(
                "text-3xl font-bold font-display tabular-nums mt-1",
                alert ? "text-amber-600" : "text-foreground",
              )}
            >
              {value}
            </p>
          </div>
          <div
            className={cn(
              "h-11 w-11 shrink-0 rounded-full flex items-center justify-center",
              styles.iconBg,
            )}
          >
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
