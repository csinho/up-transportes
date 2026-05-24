import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UUID } from "@/types";
import {
  listColaboradores,
  convidarColaborador,
  atualizarColaboradorRole,
  removerColaborador,
  getUserTenantRole,
  type ColaboradorRole,
} from "@/lib/supabase/colaboradores";

export function useColaboradores(transportadoraId: UUID | undefined) {
  return useQuery({
    queryKey: ["colaboradores", transportadoraId],
    enabled: !!transportadoraId,
    queryFn: () => listColaboradores(transportadoraId!),
    retry: 1,
  });
}

export function useUserTenantRole(transportadoraId: UUID | undefined) {
  return useQuery({
    queryKey: ["user-tenant-role", transportadoraId],
    enabled: !!transportadoraId,
    queryFn: () => getUserTenantRole(transportadoraId!),
  });
}

export function useConvidarColaborador(transportadoraId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { email: string; role: ColaboradorRole }) =>
      convidarColaborador(transportadoraId, p.email, p.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colaboradores", transportadoraId] }),
  });
}

export function useAtualizarColaboradorRole(transportadoraId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { userId: UUID; role: ColaboradorRole }) =>
      atualizarColaboradorRole(transportadoraId, p.userId, p.role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colaboradores", transportadoraId] }),
  });
}

export function useRemoverColaborador(transportadoraId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (registroId: string) => removerColaborador(transportadoraId, registroId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colaboradores", transportadoraId] }),
  });
}
