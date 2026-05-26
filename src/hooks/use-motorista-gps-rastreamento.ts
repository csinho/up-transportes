import { useMotoristaViagens } from "@/hooks/use-motorista-data";
import { useMotoristaSession } from "@/hooks/use-motorista-session";
import { useMotoristaTenantId } from "@/hooks/use-motorista-tenant";
import { useViagemGeolocalizacao } from "@/hooks/use-viagem-geolocalizacao";
import { escolherViagemParaRastreamentoGps } from "@/lib/viagem-geolocalizacao-constants";

/** Rastreamento GPS global no shell motorista (dashboard, lista, detalhe). */
export function useMotoristaGpsRastreamento() {
  const { session } = useMotoristaSession();
  const tenantId = useMotoristaTenantId();
  const { data: viagens = [] } = useMotoristaViagens();

  const viagem =
    session?.motoristaId != null
      ? escolherViagemParaRastreamentoGps(viagens, session.motoristaId)
      : undefined;

  useViagemGeolocalizacao({
    viagem,
    motoristaId: session?.motoristaId,
    tenantId,
    enabled: !!session,
  });

  return { viagemRastreando: viagem };
}
