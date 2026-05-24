import { useEffect, useState } from "react";
import type { MarcadorViagemOverview } from "@/lib/rastreamento-overview";
import { Loader2 } from "lucide-react";

type Props = {
  marcadores: MarcadorViagemOverview[];
  selecionadaId: string | null;
  onSelecionar: (viagemId: string) => void;
  className?: string;
};

export function RastreamentoOverviewMap(props: Props) {
  const [MapInner, setMapInner] = useState<React.ComponentType<Props> | null>(null);

  useEffect(() => {
    import("./RastreamentoOverviewMapInner").then((m) => {
      setMapInner(() => m.RastreamentoOverviewMapInner);
    });
  }, []);

  if (!MapInner) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/40 rounded-lg border ${props.className ?? "h-[280px]"}`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <MapInner {...props} />;
}
