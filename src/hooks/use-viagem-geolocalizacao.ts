import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Viagem } from "@/types";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { motoristaSyncLocalizacao } from "@/lib/motorista-sync";
import { generateUuid } from "@/lib/uuid";
import {
  GPS_INTERVALO_MS,
  isStatusComRastreamentoGps,
} from "@/lib/viagem-geolocalizacao-constants";

const FALHAS_ANTES_TOAST = 3;

type Options = {
  viagem: Viagem | undefined;
  motoristaId: string | undefined;
  tenantId: string;
  enabled?: boolean;
};

export function useViagemGeolocalizacao({ viagem, motoristaId, tenantId, enabled = true }: Options) {
  const qc = useQueryClient();
  const ultimoEnvio = useRef(0);
  const falhasSeguidas = useRef(0);
  const toastExibido = useRef(false);

  useEffect(() => {
    if (!enabled || !viagem || !motoristaId || !tenantId) return;
    if (!isViagemAtiva(viagem.status)) return;
    if (!isStatusComRastreamentoGps(viagem.status)) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const enviarPosicao = (pos: GeolocationPosition) => {
      const agora = Date.now();
      if (agora - ultimoEnvio.current < GPS_INTERVALO_MS - 2000) return;

      ultimoEnvio.current = agora;
      falhasSeguidas.current = 0;
      toastExibido.current = false;

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
    };

    const onErro = (err: GeolocationPositionError) => {
      falhasSeguidas.current += 1;
      if (import.meta.env.DEV) {
        console.warn("[GPS motorista]", err.code, err.message);
      }
      if (falhasSeguidas.current >= FALHAS_ANTES_TOAST && !toastExibido.current) {
        toastExibido.current = true;
        toast.message("GPS indisponível", {
          description:
            "Mantenha o app aberto na viagem e permita acesso à localização para registrar o trajeto.",
        });
      }
    };

    const watchId = navigator.geolocation.watchPosition(enviarPosicao, onErro, {
      enableHighAccuracy: true,
      maximumAge: GPS_INTERVALO_MS,
      timeout: 15_000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, viagem?.id, viagem?.status, motoristaId, tenantId, qc]);
}
