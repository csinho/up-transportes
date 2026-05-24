import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FILTER_ALL } from "@/lib/list-utils";

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  allLabel?: string;
  className?: string;
};

export function ListFilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "Todos",
  className,
}: Props) {
  return (
    <div className={className ?? "min-w-[140px]"}>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <Select value={value || FILTER_ALL} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
