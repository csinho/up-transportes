import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { pageRange } from "@/lib/list-utils";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  totalItems: number;
  page: number;
  pageSize: number;
  children?: ReactNode;
  onClear?: () => void;
};

export function ListToolbar({
  search,
  onSearchChange,
  placeholder = "Buscar…",
  totalItems,
  page,
  pageSize,
  children,
  onClear,
}: Props) {
  const { from, to } = pageRange(page, pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex flex-1 flex-wrap items-end gap-3 min-w-[200px]">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9 pr-9 h-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2"
              onClick={() => {
                onSearchChange("");
                onClear?.();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {children}
      </div>
      <p className="text-xs text-muted-foreground shrink-0">
        {totalItems === 0 ? "Nenhum resultado" : `Mostrando ${from}–${to} de ${totalItems}`}
      </p>
    </div>
  );
}
