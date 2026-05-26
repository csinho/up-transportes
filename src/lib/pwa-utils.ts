/** App já aberto como PWA (ícone na tela inicial), não no browser. */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };

  if (nav.standalone === true) return true;

  const modes = ["standalone", "fullscreen", "minimal-ui"] as const;
  for (const mode of modes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return true;
  }

  if (typeof document !== "undefined" && document.referrer.startsWith("android-app://")) {
    return true;
  }

  return false;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isSecureContextForPwa(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext;
}
