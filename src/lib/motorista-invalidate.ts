import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { isMotoristaAppPath } from "@/lib/motorista-app-path";
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
  const onMotorista =
    typeof window !== "undefined" && isMotoristaAppPath(window.location.pathname);
  if (session && onMotorista && !isMotoristaOnline()) {
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
