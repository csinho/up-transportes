import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Viagem, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao } from "@/types";
import {
  motoristaSyncViagem,
  motoristaSyncEvento,
  motoristaSyncViagemComEvento,
  motoristaSyncLocalizacao,
  motoristaRegistrarOcorrencia,
  type RegistrarOcorrenciaMotoristaInput,
  type SyncResult,
} from "@/lib/motorista-sync";

export function useMotoristaSync() {
  const qc = useQueryClient();

  const syncViagem = useCallback(
    (viagem: Viagem): Promise<SyncResult> => motoristaSyncViagem(viagem, qc),
    [qc],
  );
  const syncEvento = useCallback(
    (evento: ViagemEvento): Promise<SyncResult> => motoristaSyncEvento(evento, qc),
    [qc],
  );
  const syncViagemComEvento = useCallback(
    (viagem: Viagem, evento: ViagemEvento): Promise<SyncResult> =>
      motoristaSyncViagemComEvento(viagem, evento, qc),
    [qc],
  );
  const syncLocalizacao = useCallback(
    (loc: ViagemLocalizacao): Promise<SyncResult> => motoristaSyncLocalizacao(loc, qc),
    [qc],
  );
  const registrarOcorrencia = useCallback(
    (input: RegistrarOcorrenciaMotoristaInput): Promise<SyncResult> =>
      motoristaRegistrarOcorrencia(input, qc),
    [qc],
  );

  return { syncViagem, syncEvento, syncViagemComEvento, syncLocalizacao, registrarOcorrencia };
}
