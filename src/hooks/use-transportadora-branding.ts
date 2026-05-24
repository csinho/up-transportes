import { useQuery } from "@tanstack/react-query";
import { fetchTransportadoraBranding } from "@/lib/supabase/transportadora-branding";
import type { UUID } from "@/types";

export function useTransportadoraBranding(transportadoraId: UUID | undefined) {
  return useQuery({
    queryKey: ["transportadora-branding", transportadoraId],
    enabled: !!transportadoraId,
    queryFn: () => fetchTransportadoraBranding(transportadoraId!),
    staleTime: 5 * 60_000,
  });
}
