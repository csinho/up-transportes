import { useEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { flushMotoristaOfflineQueue } from "@/lib/motorista-sync";
import {
  getOfflineQueueCount,
  subscribeOfflineQueue,
} from "@/lib/motorista-offline-queue";

export function useMotoristaOfflineSync() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const pending = useSyncExternalStore(
    subscribeOfflineQueue,
    getOfflineQueueCount,
    () => 0,
  );

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      void (async () => {
        const n = await flushMotoristaOfflineQueue(qc);
        if (n > 0) {
          toast.success(`${n} registro${n > 1 ? "s" : ""} sincronizado${n > 1 ? "s" : ""}`);
        } else {
          toast.success("Conexão restabelecida");
        }
      })();
    };
    const onOffline = () => {
      setOnline(false);
      toast.warning("Sem conexão — alterações serão enviadas ao reconectar");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [qc]);

  return { online, pending };
}
