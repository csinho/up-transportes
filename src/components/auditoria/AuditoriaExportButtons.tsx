import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onCsv: () => void;
  onPdf: () => void;
  disabled?: boolean;
  itemCount?: number;
};

export function AuditoriaExportButtons({ onCsv, onPdf, disabled, itemCount = 0 }: Props) {
  const vazio = itemCount === 0;
  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      <Button variant="outline" size="sm" onClick={onCsv} disabled={disabled || vazio}>
        <FileSpreadsheet className="h-4 w-4 mr-1" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onPdf} disabled={disabled || vazio}>
        <FileDown className="h-4 w-4 mr-1" />
        PDF
      </Button>
    </div>
  );
}
