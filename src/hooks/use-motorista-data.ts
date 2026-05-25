import { useQuery } from "@tanstack/react-query";
import type { UUID, Viagem, Veiculo, Cliente, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao } from "@/types";
import { useMotoristaTenantId } from "@/hooks/use-motorista-tenant";
import { useMotoristaOnlineState } from "@/hooks/use-motorista-online-state";
import {
  fetchMotoristaViagens,
  fetchMotoristaVeiculos,
  fetchMotoristaClientes,
  fetchMotoristaViagem,
  fetchMotoristaViagemEventos,
  fetchMotoristaViagemOcorrencias,
  fetchMotoristaViagemLocalizacoes,
} from "@/lib/motorista-query-offline";

function useMotoristaQueryOptions() {
  const online = useMotoristaOnlineState();
  return {
    retry: false,
    refetchOnWindowFocus: online,
    refetchOnReconnect: online,
    refetchOnMount: online,
    throwOnError: false,
    gcTime: 1000 * 60 * 60 * 24,
    staleTime: online ? 30_000 : 1000 * 60 * 30,
  } as const;
}

export function useMotoristaViagens() {
  const tenant = useMotoristaTenantId();
  const opts = useMotoristaQueryOptions();
  return useQuery({
    queryKey: ["viagens", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaViagens(tenant),
    ...opts,
  });
}

export function useMotoristaViagem(id: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  const opts = useMotoristaQueryOptions();
  return useQuery({
    queryKey: ["viagens", "one", id],
    enabled: !!id && !!tenant,
    queryFn: () => (id ? fetchMotoristaViagem(id, tenant) : null),
    ...opts,
  });
}

export function useMotoristaVeiculos() {
  const tenant = useMotoristaTenantId();
  const opts = useMotoristaQueryOptions();
  return useQuery({
    queryKey: ["veiculos", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaVeiculos(tenant),
    ...opts,
  });
}

export function useMotoristaClientes() {
  const tenant = useMotoristaTenantId();
  const opts = useMotoristaQueryOptions();
  return useQuery({
    queryKey: ["clientes", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaClientes(tenant),
    ...opts,
  });
}

export function useMotoristaViagemEventos(viagemId: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  const opts = useMotoristaQueryOptions();
  return useQuery({
    queryKey: ["viagem_eventos", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemEventos(tenant, viagemId) : []),
    ...opts,
  });
}

export function useMotoristaViagemOcorrencias(viagemId: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  const opts = useMotoristaQueryOptions();
  return useQuery({
    queryKey: ["viagem_ocorrencias", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemOcorrencias(tenant, viagemId) : []),
    ...opts,
  });
}

export function useMotoristaViagemLocalizacoes(viagemId: UUID | undefined) {
  const tenant = useMotoristaTenantId();
  const opts = useMotoristaQueryOptions();
  return useQuery({
    queryKey: ["viagem_localizacoes", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemLocalizacoes(tenant, viagemId) : []),
    ...opts,
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
