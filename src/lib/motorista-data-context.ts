import { getMotoristaSession } from "@/lib/motorista-session";

export function isMotoristaAppPath(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/motorista");
}

export function isMotoristaDataContext(): boolean {
  return isMotoristaAppPath() && !!getMotoristaSession();
}
