import { useQuery } from "@tanstack/react-query";
import type { UUID, Viagem, Veiculo, Cliente, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao } from "@/types";
import { useMotoristaTenantId } from "@/hooks/use-motorista-tenant";
import {
  fetchMotoristaViagens,
  fetchMotoristaVeiculos,
  fetchMotoristaClientes,
  fetchMotoristaViagem,
  fetchMotoristaViagemEventos,
  fetchMotoristaViagemOcorrencias,
  fetchMotoristaViagemLocalizacoes,
} from "@/lib/motorista-query-offline";

/** Evita refetch na rede quando offline — usa cache do IndexedDB / React Query. */
const motoristaQueryOptions = {
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  throwOnError: false,
  gcTime: 1000 * 60 * 60 * 24,
  staleTime: 1000 * 60 * 30,
} as const;

export function useMotoristaViagens() {
  const tenant = useMotoristaTenantId();
  return useQuery({
    queryKey: ["viagens", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaViagens(tenant),
    ...motoristaQueryOptions,
  });
}

export function useMotoristaViagem(id: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  return useQuery({
    queryKey: ["viagens", "one", id],
    enabled: !!id && !!tenant,
    queryFn: () => (id ? fetchMotoristaViagem(id, tenant) : null),
    ...motoristaQueryOptions,
  });
}

export function useMotoristaVeiculos() {
  const tenant = useMotoristaTenantId();
  return useQuery({
    queryKey: ["veiculos", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaVeiculos(tenant),
    ...motoristaQueryOptions,
  });
}

export function useMotoristaClientes() {
  const tenant = useMotoristaTenantId();
  return useQuery({
    queryKey: ["clientes", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaClientes(tenant),
    ...motoristaQueryOptions,
  });
}

export function useMotoristaViagemEventos(viagemId: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  return useQuery({
    queryKey: ["viagem_eventos", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemEventos(tenant, viagemId) : []),
    ...motoristaQueryOptions,
  });
}

export function useMotoristaViagemOcorrencias(viagemId: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  return useQuery({
    queryKey: ["viagem_ocorrencias", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemOcorrencias(tenant, viagemId) : []),
    ...motoristaQueryOptions,
  });
}

export function useMotoristaViagemLocalizacoes(viagemId: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  return useQuery({
    queryKey: ["viagem_localizacoes", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemLocalizacoes(tenant, viagemId) : []),
    ...motoristaQueryOptions,
  });
}

export type {
  Viagem,
  Veiculo,
  Cliente,
  ViagemEvento,
  ViagemOcorrencia,
  ViagemLocalizacao,
};
