import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMotoristaSession } from "@/lib/motorista-session";
import { isMotoristaOnline } from "@/lib/motorista-online";
import {
  loadMotoristaCacheIntoQueries,
  refreshMotoristaSnapshotFromNetwork,
} from "@/lib/motorista-cache-sync";
import { patchMotoristaQueriesFromCache } from "@/lib/motorista-offline-store";
import { cacheMotoristaShellInServiceWorker } from "@/lib/motorista-sw-cache";
import { prefetchMotoristaOfflineChunks } from "@/lib/motorista-chunk-prefetch";
import {
  markOfflineReadyToastShown,
  shouldShowOfflineReadyToast,
} from "@/lib/motorista-offline-toast";

const SESSION_SETUP_KEY = "erp_transp_motorista_setup_session_v1";

let setupInFlight: Promise<void> | null = null;

function sessionSetupKey(tenantId: string, motoristaId: string): string {
  return `${tenantId}:${motoristaId}`;
}

function wasSetupThisSession(tenantId: string, motoristaId: string): boolean {
  try {
    return (
      sessionStorage.getItem(SESSION_SETUP_KEY) === sessionSetupKey(tenantId, motoristaId)
    );
  } catch {
    return false;
  }
}

function markSetupThisSession(tenantId: string, motoristaId: string): void {
  try {
    sessionStorage.setItem(SESSION_SETUP_KEY, sessionSetupKey(tenantId, motoristaId));
  } catch {
    /* ignore */
  }
}

export function clearMotoristaSetupSession(): void {
  try {
    sessionStorage.removeItem(SESSION_SETUP_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Prepara o aparelho para uso offline (uma vez por sessão do browser):
 * snapshot IndexedDB + todos os chunks JS + cache do SW.
 * Chamado ao abrir qualquer tela autenticada do motorista com internet.
 */
export async function runMotoristaOfflineSetup(qc: QueryClient): Promise<void> {
  const session = getMotoristaSession();
  if (!session || !isMotoristaOnline()) return;

  if (setupInFlight) return setupInFlight;

  setupInFlight = (async () => {
    const { transportadoraId, motoristaId } = session;

    await loadMotoristaCacheIntoQueries(qc, transportadoraId);
    await cacheMotoristaShellInServiceWorker();

    const alreadySynced = wasSetupThisSession(transportadoraId, motoristaId);

    if (!alreadySynced) {
      const result = await refreshMotoristaSnapshotFromNetwork(
        transportadoraId,
        motoristaId,
      );
      if (result.ok) {
        patchMotoristaQueriesFromCache(qc, result.cache);
        markSetupThisSession(transportadoraId, motoristaId);

        if (shouldShowOfflineReadyToast(transportadoraId)) {
          toast.success("Dados salvos no aparelho para uso offline");
          markOfflineReadyToastShown(transportadoraId);
        }
      } else {
        console.error("[motorista-offline] Snapshot:", result.error);
      }
    }

    await prefetchMotoristaOfflineChunks();
  })().finally(() => {
    setupInFlight = null;
  });

  return setupInFlight;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Atualiza Supabase → IndexedDB → React Query (sem toast). Usado em Realtime e ao voltar ao app. */
export async function refreshMotoristaDataFromNetwork(qc: QueryClient): Promise<boolean> {
  const session = getMotoristaSession();
  if (!session || !isMotoristaOnline()) return false;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const result = await refreshMotoristaSnapshotFromNetwork(
      session.transportadoraId,
      session.motoristaId,
    );
    if (result.ok) {
      patchMotoristaQueriesFromCache(qc, result.cache);
      return true;
    }
    console.warn("[motorista-live] Falha ao atualizar:", result.error);
    return false;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
