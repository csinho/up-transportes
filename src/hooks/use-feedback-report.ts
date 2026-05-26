import { useMutation } from "@tanstack/react-query";
import { enviarFeedbackReport, type EnviarFeedbackInput } from "@/lib/supabase/feedback";

export function useEnviarFeedbackReport() {
  return useMutation({
    mutationFn: (input: EnviarFeedbackInput) => enviarFeedbackReport(input),
  });
}
