import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      toast.success("Conexão restabelecida");
    };
    const onOffline = () => {
      setOnline(false);
      toast.warning("Sem conexão — alterações serão salvas localmente");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}
