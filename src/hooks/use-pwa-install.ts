import { useCallback, useEffect, useState } from "react";
import { isIosDevice, isStandalonePwa } from "@/lib/pwa-utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function readStandalone(): boolean {
  return isStandalonePwa();
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const sync = () => setStandalone(readStandalone());
    sync();

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setStandalone(true);
      setDeferredPrompt(null);
    };

    const mq = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => sync();

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    document.addEventListener("visibilitychange", sync);
    mq.addEventListener("change", onDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      document.removeEventListener("visibilitychange", sync);
      mq.removeEventListener("change", onDisplayMode);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setStandalone(true);
    return outcome === "accepted";
  }, [deferredPrompt]);

  return {
    isIos: isIosDevice(),
    isStandalone: standalone,
    canPromptInstall: Boolean(deferredPrompt),
    install,
  };
}
