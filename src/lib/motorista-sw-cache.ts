const MOTORISTA_SHELL_URLS = [
  "/motorista",
  "/motorista/dashboard",
  "/motorista/viagens",
];

/** Pede ao Service Worker que grave HTML/rotas no Cache Storage (abrir PWA offline). */
export async function cacheMotoristaShellInServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: "CACHE_MOTORISTA_ROUTES",
      urls: MOTORISTA_SHELL_URLS,
    });
  } catch (err) {
    console.warn("[PWA] Falha ao cachear shell no Service Worker:", err);
  }
}
