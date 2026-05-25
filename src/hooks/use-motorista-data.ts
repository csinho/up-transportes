import { useQuery } from "@tanstack/react-query";
import type { UUID, Viagem, Veiculo, Cliente, ViagemEvento, ViagemOcorrencia, ViagemLocalizacao } from "@/types";
import { useActiveTenantId } from "@/data/store";
import {
  fetchMotoristaViagens,
  fetchMotoristaVeiculos,
  fetchMotoristaClientes,
  fetchMotoristaViagem,
  fetchMotoristaViagemEventos,
  fetchMotoristaViagemOcorrencias,
  fetchMotoristaViagemLocalizacoes,
} from "@/lib/motorista-query-offline";

/** Viagens — PWA motorista (lê IndexedDB offline após sync no dashboard). */
export function useMotoristaViagens() {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["viagens", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaViagens(tenant),
    staleTime: 30_000,
  });
}

export function useMotoristaViagem(id: UUID | undefined) {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["viagens", "one", id],
    enabled: !!id && !!tenant,
    queryFn: () => (id ? fetchMotoristaViagem(id, tenant) : null),
    staleTime: 15_000,
  });
}

export function useMotoristaVeiculos() {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["veiculos", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaVeiculos(tenant),
    staleTime: 60_000,
  });
}

export function useMotoristaClientes() {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["clientes", tenant],
    enabled: !!tenant,
    queryFn: () => fetchMotoristaClientes(tenant),
    staleTime: 60_000,
  });
}

export function useMotoristaViagemEventos(viagemId: UUID | undefined) {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["viagem_eventos", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemEventos(tenant, viagemId) : []),
    staleTime: 15_000,
  });
}

export function useMotoristaViagemOcorrencias(viagemId: UUID | undefined) {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["viagem_ocorrencias", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemOcorrencias(tenant, viagemId) : []),
    staleTime: 15_000,
  });
}

export function useMotoristaViagemLocalizacoes(viagemId: UUID | undefined) {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["viagem_localizacoes", tenant, viagemId],
    enabled: !!viagemId && !!tenant,
    queryFn: () => (viagemId ? fetchMotoristaViagemLocalizacoes(tenant, viagemId) : []),
    staleTime: 10_000,
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
