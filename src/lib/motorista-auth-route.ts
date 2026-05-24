import { redirect } from "@tanstack/react-router";
import { getMotoristaSession } from "@/lib/motorista-session";

/** Guarda rotas protegidas do PWA — só roda no browser. */
export function requireMotoristaSession() {
  if (typeof window === "undefined") return;
  if (!getMotoristaSession()) {
    throw redirect({ to: "/motorista", replace: true });
  }
}

/** Login: se já autenticado, vai direto ao dashboard. */
export function redirectMotoristaSeAutenticado() {
  if (typeof window === "undefined") return;
  if (getMotoristaSession()) {
    throw redirect({ to: "/motorista/dashboard", replace: true });
  }
}
