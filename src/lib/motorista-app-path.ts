/** Rotas do PWA em /motorista — não confundir com /motoristas (cadastro ERP). */
export function isMotoristaAppPath(pathname: string): boolean {
  return pathname === "/motorista" || pathname.startsWith("/motorista/");
}

export function fmtMoeda(valor?: number): string {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
