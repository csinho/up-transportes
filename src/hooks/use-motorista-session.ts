import { useCallback, useEffect, useState } from "react";
import type { Motorista, UUID } from "@/types";
import { onlyDigits } from "@/lib/masks";
import {
  clearMotoristaSession,
  getMotoristaSession,
  setMotoristaSession,
  type MotoristaSession,
} from "@/lib/motorista-session";
import { logoutMotoristaSupabase } from "@/lib/supabase/motorista-auth";

function readSession(): MotoristaSession | null {
  if (typeof window === "undefined") return null;
  return getMotoristaSession();
}

export function useMotoristaSession() {
  const [session, setSession] = useState<MotoristaSession | null>(readSession);

  useEffect(() => {
    const refresh = () => setSession(readSession());
    refresh();
    window.addEventListener("motorista-session", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("motorista-session", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const loginWithAuth = useCallback(
    (p: { motoristaId: UUID; transportadoraId: UUID; nome: string; cpf: string }) => {
      const next: MotoristaSession = {
        motoristaId: p.motoristaId,
        transportadoraId: p.transportadoraId,
        nome: p.nome,
        cpf: p.cpf,
        loggedAt: new Date().toISOString(),
      };
      setMotoristaSession(next);
      setSession(next);
      window.dispatchEvent(new Event("motorista-session"));
    },
    [],
  );

  const login = useCallback((motorista: Motorista) => {
    loginWithAuth({
      motoristaId: motorista.id,
      transportadoraId: motorista.transportadora_id,
      nome: motorista.nome,
      cpf: motorista.cpf,
    });
  }, [loginWithAuth]);

  const logout = useCallback(() => {
    void logoutMotoristaSupabase();
    clearMotoristaSession();
    setSession(null);
    window.dispatchEvent(new Event("motorista-session"));
  }, []);

  return { session, login, loginWithAuth, logout, isLoggedIn: !!session };
}

export function findMotoristaByCpf(motoristas: Motorista[], cpfInput: string): Motorista | undefined {
  const digits = onlyDigits(cpfInput);
  if (digits.length !== 11) return undefined;
  return motoristas.find((m) => onlyDigits(m.cpf) === digits);
}

export function motoristaPodeEntrar(m: Motorista): { ok: true } | { ok: false; motivo: string } {
  if (m.status === "inativo") return { ok: false, motivo: "Motorista inativo no cadastro." };
  if (m.status === "bloqueado") return { ok: false, motivo: "Motorista bloqueado. Contate a transportadora." };
  return { ok: true };
}
