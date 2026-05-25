import { useQuery } from "@tanstack/react-query";
import { fetchTransportadoraBranding } from "@/lib/supabase/transportadora-branding";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { isMotoristaAppPath } from "@/lib/motorista-app-path";
import type { UUID } from "@/types";

export function useTransportadoraBranding(transportadoraId: UUID | undefined) {
  const onMotorista =
    typeof window !== "undefined" && isMotoristaAppPath(window.location.pathname);
  const networkOk = !onMotorista || isMotoristaOnline();

  return useQuery({
    queryKey: ["transportadora-branding", transportadoraId],
    enabled: !!transportadoraId && networkOk,
    queryFn: () => fetchTransportadoraBranding(transportadoraId!),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });
}
