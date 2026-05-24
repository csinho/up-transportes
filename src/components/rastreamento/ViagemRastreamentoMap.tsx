import { useEffect, useState } from "react";
import type { DadosMapaViagem } from "@/lib/rastreamento-mapa";
import { Loader2 } from "lucide-react";

type Props = {
  dados: DadosMapaViagem | null;
  className?: string;
};

export function ViagemRastreamentoMap({ dados, className }: Props) {
  const [MapInner, setMapInner] = useState<
    React.ComponentType<{ dados: DadosMapaViagem | null; className?: string }> | null
  >(null);

  useEffect(() => {
    import("./ViagemRastreamentoMapInner").then((m) => {
      setMapInner(() => m.ViagemRastreamentoMapInner);
    });
  }, []);

  if (!MapInner) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/40 rounded-lg border ${className ?? "h-[480px]"}`}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <MapInner dados={dados} className={className} />;
}
