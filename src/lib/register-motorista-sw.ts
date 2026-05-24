/** Registra SW mínimo — exigido pelo Chrome para oferecer instalação como PWA. */
export function registerMotoristaServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  void navigator.serviceWorker
    .register("/sw.js", { scope: "/motorista/" })
    .catch((err) => console.warn("[PWA] Falha ao registrar service worker:", err));
}
