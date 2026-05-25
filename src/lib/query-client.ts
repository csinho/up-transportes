import { QueryClient } from "@tanstack/react-query";

/** Defaults globais — evita refetch e “loading” ao trocar de aba do navegador. */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 30_000,
      },
    },
  });
}
