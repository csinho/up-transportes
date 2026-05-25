import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { isMotoristaDataContext } from "@/lib/motorista-data-context";
import {
  getMotoristaCache,
  patchMotoristaQueriesFromCache,
} from "@/lib/motorista-offline-store";

function invalidateRecursosQueries(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["viagens"] });
  qc.invalidateQueries({ queryKey: ["motoristas"] });
  qc.invalidateQueries({ queryKey: ["veiculos"] });
}

export function invalidateMotoristaData(qc: QueryClient) {
  const session = getMotoristaSession();
  if (session && isMotoristaDataContext() && !isMotoristaOnline()) {
    void (async () => {
      const cache = await getMotoristaCache(session.transportadoraId);
      if (cache) patchMotoristaQueriesFromCache(qc, cache);
    })();
    return;
  }
  invalidateRecursosQueries(qc);
  qc.invalidateQueries({ queryKey: ["viagem_eventos"] });
  qc.invalidateQueries({ queryKey: ["viagem_ocorrencias"] });
  qc.invalidateQueries({ queryKey: ["viagem_localizacoes"] });
}
