import { useQuery } from "@tanstack/react-query";
import {
  type FipeCategoria,
  listarAnosFipe,
  listarMarcasFipe,
  listarModelosFipe,
  deduplicarAnosFipe,
} from "@/lib/fipe-api";

const STALE_MS = 1000 * 60 * 60 * 24;

export function useFipeMarcas(categoria: FipeCategoria = "caminhoes") {
  return useQuery({
    queryKey: ["fipe", "marcas", categoria],
    queryFn: () => listarMarcasFipe(categoria),
    staleTime: STALE_MS,
  });
}

export function useFipeModelos(categoria: FipeCategoria, marcaCodigo?: string) {
  return useQuery({
    queryKey: ["fipe", "modelos", categoria, marcaCodigo],
    queryFn: () => listarModelosFipe(categoria, marcaCodigo!),
    enabled: !!marcaCodigo,
    staleTime: STALE_MS,
  });
}

export function useFipeAnos(
  categoria: FipeCategoria,
  marcaCodigo?: string,
  modeloCodigo?: string,
) {
  return useQuery({
    queryKey: ["fipe", "anos", categoria, marcaCodigo, modeloCodigo],
    queryFn: async () => deduplicarAnosFipe(await listarAnosFipe(categoria, marcaCodigo!, modeloCodigo!)),
    enabled: !!marcaCodigo && !!modeloCodigo,
    staleTime: STALE_MS,
  });
}
