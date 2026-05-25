import { isMotoristaOnline } from "@/lib/motorista-online";
import { cacheMotoristaAssetsInServiceWorker } from "@/lib/motorista-sw-cache";

/** Módulos lazy das rotas — força download dos chunks JS no aparelho. */
const MOTORISTA_ROUTE_MODULES = [
  () => import("@/routes/motorista.dashboard"),
  () => import("@/routes/motorista.viagens"),
  () => import("@/routes/motorista.viagens.index"),
  () => import("@/routes/motorista.viagens.$id"),
  () => import("@/routes/motorista.index"),
  () => import("@/components/motorista/MotoristaShell"),
] as const;

const ASSET_HINT =
  /motorista|motoristashell|use-motorista-data|viagemprogresso|viagemeventos|viagem-progresso/i;

let prefetchDone = false;

function collectMotoristaAssetPaths(): string[] {
  const seen = new Set<string>();
  for (const entry of performance.getEntriesByType("resource")) {
    const url = entry.name;
    if (!url.includes("/assets/") || !ASSET_HINT.test(url)) continue;
    try {
      seen.add(new URL(url, window.location.origin).pathname);
    } catch {
      /* ignore */
    }
  }
  return [...seen];
}

/** Baixa chunks do app motorista e grava no cache do Service Worker (uso offline). */
export async function prefetchMotoristaOfflineChunks(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isMotoristaOnline()) return;
  if (prefetchDone && !force) return;

  prefetchDone = true;

  await Promise.allSettled(MOTORISTA_ROUTE_MODULES.map((load) => load()));

  const paths = collectMotoristaAssetPaths();
  if (paths.length === 0) return;

  await Promise.allSettled(
    paths.map((path) => fetch(path, { credentials: "same-origin", cache: "force-cache" })),
  );

  await cacheMotoristaAssetsInServiceWorker(paths);
}

export function resetMotoristaChunkPrefetch(): void {
  prefetchDone = false;
}
