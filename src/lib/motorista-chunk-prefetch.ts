import { isMotoristaOnline } from "@/lib/motorista-online";
import { cacheMotoristaAssetsInServiceWorker } from "@/lib/motorista-sw-cache";

/**
 * Mapa offline do PWA motorista (telas + ações que precisam funcionar sem rede):
 *
 * | Tela / fluxo | Rota | Ações offline |
 * |--------------|------|----------------|
 * | Login | /motorista | Entrada com CPF (cache IndexedDB) |
 * | Dashboard | /motorista/dashboard | Resumo, viagem em destaque |
 * | Lista viagens | /motorista/viagens | Abas ativas/concluídas/todas |
 * | Detalhe viagem | /motorista/viagens/:id | Ver dados, progresso, histórico |
 * | Status viagem | (detalhe) | Iniciar, parada, trânsito, descarga, retomar |
 * | Ocorrência | (detalhe) | Abrir sheet, registrar ocorrência |
 * | Finalizar | (detalhe) | Sheet de encerramento |
 * | GPS | (detalhe, viagem ativa) | Fila local de posições |
 *
 * Todos os chunks JS dessas telas são pré-baixados aqui ao abrir o app com internet.
 */

const MOTORISTA_MODULE_LOADERS = {
  ...import.meta.glob("/src/routes/motorista*.tsx"),
  ...import.meta.glob("/src/routes/motorista.*.tsx"),
  ...import.meta.glob("/src/components/motorista/**/*.tsx"),
  ...import.meta.glob([
    "/src/components/viagem/ViagemProgressoCard.tsx",
    "/src/components/viagem/ViagemEventosTimeline.tsx",
  ]),
  ...import.meta.glob([
    "/src/hooks/use-motorista-*.ts",
    "/src/hooks/use-motorista-sync.ts",
    "/src/hooks/use-viagem-geolocalizacao.ts",
  ]),
} as Record<string, () => Promise<unknown>>;

const ASSET_EXCLUDE = /vfs_fonts|leaflet|router-|server-|pt-br-dvbhow74/i;

const ASSET_INCLUDE =
  /motorista|motoristashell|use-motorista|viagemprogresso|viagemeventos|viagem-progresso|tabs-|alert-dialog|sheet|ocorrencia|finalizar|viagemcard|viagemdestaque|dashboardresumo/i;

let prefetchInFlight: Promise<void> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadAllMotoristaModules(): Promise<void> {
  const loaders = Object.values(MOTORISTA_MODULE_LOADERS);
  await Promise.allSettled(loaders.map((load) => load()));
  await sleep(600);
  await Promise.allSettled(loaders.map((load) => load()));
}

function collectMotoristaAssetPaths(): string[] {
  const seen = new Set<string>();
  for (const entry of performance.getEntriesByType("resource")) {
    const url = entry.name;
    if (!url.includes("/assets/") || !url.endsWith(".js")) continue;
    if (ASSET_EXCLUDE.test(url)) continue;
    if (!ASSET_INCLUDE.test(url)) continue;
    try {
      seen.add(new URL(url, window.location.origin).pathname);
    } catch {
      /* ignore */
    }
  }
  return [...seen];
}

/** Pré-baixa todos os chunks do motorista e grava no Service Worker. */
export async function prefetchMotoristaOfflineChunks(): Promise<void> {
  if (typeof window === "undefined" || !isMotoristaOnline()) return;

  if (prefetchInFlight) return prefetchInFlight;

  prefetchInFlight = (async () => {
    await loadAllMotoristaModules();

    const paths = collectMotoristaAssetPaths();
    if (paths.length === 0) {
      console.warn("[motorista-offline] Nenhum chunk detectado para cache offline.");
      return;
    }

    await Promise.allSettled(
      paths.map((path) => fetch(path, { credentials: "same-origin" })),
    );

    await cacheMotoristaAssetsInServiceWorker(paths);
    console.info(`[motorista-offline] ${paths.length} chunk(s) cacheados para uso offline.`);
  })().finally(() => {
    prefetchInFlight = null;
  });

  return prefetchInFlight;
}

export function resetMotoristaChunkPrefetch(): void {
  prefetchInFlight = null;
}
