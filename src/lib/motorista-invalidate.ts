import type { QueryClient } from "@tanstack/react-query";
import { getMotoristaSession } from "@/lib/motorista-session";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { isMotoristaAppPath } from "@/lib/motorista-app-path";
import {
  getMotoristaCache,
  patchMotoristaQueriesFromCache,
} from "@/lib/motorista-offline-store";

function patchMotoristaFromIdb(qc: QueryClient, tenantId: string) {
  void (async () => {
    const cache = await getMotoristaCache(tenantId);
    if (cache) patchMotoristaQueriesFromCache(qc, cache);
  })();
}

function invalidateRecursosQueries(qc: QueryClient) {
  const opts = { refetchType: "active" as const };
  void qc.invalidateQueries({ queryKey: ["viagens"], ...opts });
  void qc.invalidateQueries({ queryKey: ["motoristas"], ...opts });
  void qc.invalidateQueries({ queryKey: ["veiculos"], ...opts });
}

export function invalidateMotoristaData(qc: QueryClient) {
  const session = getMotoristaSession();
  const onMotorista =
    typeof window !== "undefined" && isMotoristaAppPath(window.location.pathname);

  if (session && onMotorista && !isMotoristaOnline()) {
    patchMotoristaFromIdb(qc, session.transportadoraId);
    return;
  }

  if (session && onMotorista) {
    patchMotoristaFromIdb(qc, session.transportadoraId);
  }

  invalidateRecursosQueries(qc);
  void qc.invalidateQueries({ queryKey: ["viagem_eventos"], refetchType: "active" });
  void qc.invalidateQueries({ queryKey: ["viagem_ocorrencias"], refetchType: "active" });
  void qc.invalidateQueries({ queryKey: ["viagem_localizacoes"], refetchType: "active" });
}
