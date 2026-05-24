export function isPlataformaLoginPath(pathname: string): boolean {
  return pathname === "/plataforma/login";
}

export function isPlataformaPath(pathname: string): boolean {
  if (isPlataformaLoginPath(pathname)) return false;
  return pathname === "/plataforma" || pathname.startsWith("/plataforma/");
}
