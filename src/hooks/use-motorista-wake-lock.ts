import { useEffect } from "react";
import type { Viagem } from "@/types";
import { isStatusComRastreamentoGps } from "@/lib/viagem-geolocalizacao-constants";

/** Mantém a tela ativa enquanto há viagem rastreável (reduz suspensão do GPS no PWA). */
export function useMotoristaWakeLock(viagem: Viagem | undefined) {
  useEffect(() => {
    if (!viagem || !isStatusComRastreamentoGps(viagem.status)) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener("release", () => {
          if (!cancelled && document.visibilityState === "visible") {
            void request();
          }
        });
      } catch {
        /* permissão negada ou não suportado */
      }
    };

    void request();

    const onVisible = () => {
      if (document.visibilityState === "visible" && !lock?.released) {
        void request();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [viagem?.id, viagem?.status]);
}
