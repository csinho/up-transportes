import { useEffect, useState } from "react";

/** Estado reativo de conexão (para refetch automático quando online). */
export function useMotoristaOnlineState(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
