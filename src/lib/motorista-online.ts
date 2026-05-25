export function isMotoristaOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
