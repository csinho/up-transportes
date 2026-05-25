import type { QueryClient } from "@tanstack/react-query";
import { onlyDigits } from "@/lib/masks";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { getMotoristaSession, type MotoristaSession } from "@/lib/motorista-session";
import { getMotoristaCache } from "@/lib/motorista-offline-store";
import { loadMotoristaCacheIntoQueries } from "@/lib/motorista-cache-sync";

export type OfflineLoginResult =
  | { ok: true; session: MotoristaSession }
  | { ok: false; message: string };

/** Entrada offline: só com sessão + snapshot já salvos neste aparelho. */
export async function tryMotoristaOfflineLogin(
  cpfInput: string,
  qc: QueryClient,
): Promise<OfflineLoginResult> {
  if (isMotoristaOnline()) {
    return { ok: false, message: "use_online" };
  }

  const saved = getMotoristaSession();
  if (!saved) {
    return {
      ok: false,
      message:
        "Sem internet. O primeiro login neste aparelho precisa ser feito com conexão.",
    };
  }

  const cpf = onlyDigits(cpfInput);
  const savedCpf = onlyDigits(saved.cpf);
  if (cpf.length !== 11 || cpf !== savedCpf) {
    return {
      ok: false,
      message:
        "Sem internet. Use o mesmo CPF do último login neste aparelho ou conecte-se à internet.",
    };
  }

  const cache = await getMotoristaCache(saved.transportadoraId);
  if (!cache) {
    return {
      ok: false,
      message:
        "Sem dados salvos no aparelho. Abra o app com internet, entre no dashboard e aguarde a mensagem de salvamento offline.",
    };
  }

  const loaded = await loadMotoristaCacheIntoQueries(qc, saved.transportadoraId);
  if (!loaded) {
    return {
      ok: false,
      message: "Não foi possível carregar os dados offline. Tente com internet.",
    };
  }

  return { ok: true, session: saved };
}
