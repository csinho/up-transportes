/** Solicita posição do GPS uma vez (reutiliza permissão já concedida). */
export function requestMotoristaLocationOnce(): Promise<GeolocationPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 },
    );
  });
}
