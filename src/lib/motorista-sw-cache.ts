const MOTORISTA_SHELL_URLS = [
  "/motorista",
  "/motorista/dashboard",
  "/motorista/viagens",
];

/** Informa ao SW que o motorista está logado (abre dashboard offline ao reiniciar o PWA). */
export async function syncMotoristaOfflineAuthToServiceWorker(loggedIn: boolean): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({
      type: "MOTORISTA_OFFLINE_AUTH",
      loggedIn,
      urls: loggedIn ? MOTORISTA_SHELL_URLS : [],
    });
  } catch (err) {
    console.warn("[PWA] Falha ao sincronizar auth offline no Service Worker:", err);
  }
}

/** Cacheia HTML/rotas + marca sessão no SW. */
export async function cacheMotoristaShellInServiceWorker(): Promise<void> {
  await syncMotoristaOfflineAuthToServiceWorker(true);
}

/** Grava chunks JS/CSS do motorista no cache do Service Worker. */
export async function cacheMotoristaAssetsInServiceWorker(urls: string[]): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || urls.length === 0) {
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "CACHE_MOTORISTA_ASSETS", urls });
  } catch (err) {
    console.warn("[PWA] Falha ao cachear assets do motorista no SW:", err);
  }
}
