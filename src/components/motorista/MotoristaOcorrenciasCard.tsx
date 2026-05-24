import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Viagem, ViagemOcorrencia } from "@/types";
import {
  GRAVIDADE_OCORRENCIA,
  STATUS_OCORRENCIA,
  TIPOS_VIAGEM_OCORRENCIA,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";
import { MotoristaOcorrenciaSheet, type OcorrenciaFormData } from "./MotoristaOcorrenciaSheet";
import { useMotoristaSync } from "@/hooks/use-motorista-sync";
import { viagemStatusAposOcorrencia } from "@/lib/motorista-sync";
import { toast } from "sonner";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { generateUuid } from "@/lib/uuid";

const GRAVIDADE_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  baixa: "secondary",
  media: "default",
  alta: "destructive",
  critica: "destructive",
};

type Props = {
  viagem: Viagem;
  ocorrencias: ViagemOcorrencia[];
  motoristaId: string;
  onViagemUpdated?: (viagem: Viagem) => void;
};

export function MotoristaOcorrenciasCard({
  viagem,
  ocorrencias,
  motoristaId,
  onViagemUpdated,
}: Props) {
  const { registrarOcorrencia } = useMotoristaSync();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const podeRegistrar = isViagemAtiva(viagem.status);

  const registrar = async (data: OcorrenciaFormData) => {
    if (data.titulo.length < 3 || data.descricao.length < 10) {
      toast.error("Preencha título e descrição (mín. 10 caracteres).");
      return;
    }

    setSalvando(true);
    try {
      const now = new Date().toISOString();
      const ocorrenciaId = generateUuid();
      const novoStatus = viagemStatusAposOcorrencia(viagem.status);

      const viagemAtualizada: Viagem | undefined =
        novoStatus !== viagem.status
          ? { ...viagem, status: novoStatus, updated_at: now }
          : undefined;

      const result = await registrarOcorrencia({
        ocorrencia: {
          id: ocorrenciaId,
          transportadora_id: viagem.transportadora_id,
          viagem_id: viagem.id,
          tipo: data.tipo,
          gravidade: data.gravidade,
          status: "aberta",
          titulo: data.titulo,
          descricao: data.descricao,
          latitude: data.latitude,
          longitude: data.longitude,
          motorista_id: motoristaId,
          created_at: now,
          updated_at: now,
        },
        evento: {
          id: generateUuid(),
          transportadora_id: viagem.transportadora_id,
          viagem_id: viagem.id,
          tipo: "ocorrencia_registrada",
          titulo: `Ocorrência: ${data.titulo}`,
          descricao: data.descricao,
          status_anterior: viagem.status,
          status_novo: viagemAtualizada?.status ?? viagem.status,
          origem: "motorista",
          motorista_id: motoristaId,
          created_at: now,
        },
        viagemAtualizada,
      });

      if (viagemAtualizada) onViagemUpdated?.(viagemAtualizada);

      setSheetOpen(false);

      if (result === "queued") {
        toast.success("Ocorrência salva no aparelho — será enviada ao reconectar");
      } else {
        toast.success("Ocorrência registrada");
      }
    } catch {
      toast.error("Não foi possível salvar. Verifique a conexão e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Ocorrências
        </CardTitle>
        {podeRegistrar && (
          <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {ocorrencias.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma ocorrência registrada nesta viagem.
          </p>
        ) : (
          ocorrencias.slice(0, 5).map((oc) => (
            <div key={oc.id} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-sm">{oc.titulo}</p>
                <Badge variant={GRAVIDADE_VARIANT[oc.gravidade] ?? "secondary"}>
                  {GRAVIDADE_OCORRENCIA.find((g) => g.value === oc.gravidade)?.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{oc.descricao}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {TIPOS_VIAGEM_OCORRENCIA.find((t) => t.value === oc.tipo)?.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {STATUS_OCORRENCIA.find((s) => s.value === oc.status)?.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(oc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))
        )}
      </CardContent>

      <MotoristaOcorrenciaSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={registrar}
        loading={salvando}
      />
    </Card>
  );
}
