import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformFeedback,
  listPlatformFeedback,
  updatePlatformFeedbackStatus,
} from "@/lib/supabase/feedback";
import type { FeedbackStatus } from "@/types";

export function usePlatformFeedbackList(transportadoraId: string | undefined) {
  return useQuery({
    queryKey: ["platform-feedback", transportadoraId],
    enabled: !!transportadoraId,
    queryFn: () => listPlatformFeedback(transportadoraId!),
  });
}

export function usePlatformFeedbackDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["platform-feedback-detail", id],
    enabled: !!id,
    queryFn: () => getPlatformFeedback(id!),
  });
}

export function useUpdatePlatformFeedbackStatus(transportadoraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; status: FeedbackStatus }) =>
      updatePlatformFeedbackStatus(p.id, p.status),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["platform-feedback", transportadoraId] });
      void qc.invalidateQueries({ queryKey: ["platform-feedback-detail", vars.id] });
    },
  });
}
