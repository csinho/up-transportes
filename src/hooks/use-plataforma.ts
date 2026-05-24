import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bootstrapFirstPlatformAdmin,
  criarTransportadoraPlatform,
  getPlatformTransportadora,
  isPlatformAdmin,
  listPlatformTransportadoras,
  setTransportadoraAtiva,
  type PlanoTransportadora,
} from "@/lib/supabase/plataforma";

export function useIsPlatformAdmin() {
  return useQuery({
    queryKey: ["platform-admin"],
    queryFn: isPlatformAdmin,
    staleTime: 60_000,
  });
}

export function usePlatformTransportadoras() {
  return useQuery({
    queryKey: ["platform-transportadoras"],
    queryFn: listPlatformTransportadoras,
  });
}

export function usePlatformTransportadora(id: string | undefined) {
  return useQuery({
    queryKey: ["platform-transportadora", id],
    enabled: !!id,
    queryFn: () => getPlatformTransportadora(id!),
  });
}

export function useBootstrapPlatformAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bootstrapFirstPlatformAdmin,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-admin"] });
    },
  });
}

export function useCriarTransportadoraPlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      nome_fantasia: string;
      razao_social: string;
      owner_email: string;
      cnpj?: string;
      plano?: PlanoTransportadora;
    }) => criarTransportadoraPlatform(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-transportadoras"] });
    },
  });
}

export function useSetTransportadoraAtiva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; ativa: boolean; motivo?: string }) =>
      setTransportadoraAtiva(p.id, p.ativa, p.motivo),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["platform-transportadoras"] });
      void qc.invalidateQueries({ queryKey: ["platform-transportadora", vars.id] });
    },
  });
}
