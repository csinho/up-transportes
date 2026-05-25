import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Viagem } from "@/types";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { motoristaSyncLocalizacao } from "@/lib/motorista-sync";
import { generateUuid } from "@/lib/uuid";

const INTERVALO_MS = 45_000;
const STATUS_COM_RASTREAMENTO = new Set<Viagem["status"]>([
  "em_carregamento",
  "em_transito",
  "parada",
  "em_descarga",
  "com_ocorrencia",
]);

type Options = {
  viagem: Viagem | undefined;
  motoristaId: string | undefined;
  tenantId: string;
  enabled?: boolean;
};

export function useViagemGeolocalizacao({ viagem, motoristaId, tenantId, enabled = true }: Options) {
  const qc = useQueryClient();
  const ultimoEnvio = useRef(0);

  useEffect(() => {
    if (!enabled || !viagem || !motoristaId || !tenantId) return;
    if (!isViagemAtiva(viagem.status)) return;
    if (!STATUS_COM_RASTREAMENTO.has(viagem.status)) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const enviarPosicao = () => {
      const agora = Date.now();
      if (agora - ultimoEnvio.current < INTERVALO_MS - 2000) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          ultimoEnvio.current = Date.now();
          const ts = new Date().toISOString();
          void motoristaSyncLocalizacao(
            {
              id: generateUuid(),
              transportadora_id: tenantId,
              viagem_id: viagem.id,
              motorista_id: motoristaId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              velocidade_kmh:
                pos.coords.speed != null ? Math.max(0, pos.coords.speed * 3.6) : undefined,
              precisao_metros: pos.coords.accuracy,
              heading: pos.coords.heading ?? undefined,
              registrado_em: ts,
              created_at: ts,
            },
            qc,
          );
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 15_000, timeout: 12_000 },
      );
    };

    enviarPosicao();
    const timer = window.setInterval(enviarPosicao, INTERVALO_MS);
    return () => window.clearInterval(timer);
  }, [enabled, viagem?.id, viagem?.status, motoristaId, tenantId, qc]);
}
