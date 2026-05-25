/** Registra SW com cache do shell — necessário para PWA abrir sem internet. */
export function registerMotoristaServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  void navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((reg) => {
      void reg.update();
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
    })
    .catch((err) => console.warn("[PWA] Falha ao registrar service worker:", err));
}
