export function isAcompanharPath(pathname: string): boolean {
  return pathname === "/acompanhar" || pathname.startsWith("/acompanhar/");
}

export function acompanharUrl(token: string): string {
  if (typeof window === "undefined") return `/acompanhar/${token}`;
  return `${window.location.origin}/acompanhar/${token}`;
}
