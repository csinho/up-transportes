import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { DocumentoAnexo, Viagem, ViagemEvento } from "@/types";
import { requestMotoristaLocationOnce } from "@/lib/motorista-geolocation";
import { isMotoristaOnline } from "@/lib/motorista-online";
import { motoristaSyncLocalizacao } from "@/lib/motorista-sync";
import {
  getAcoesMotorista,
  inferirStatusRetomar,
  motoristaPodeFinalizar,
  type AcaoMotoristaViagem,
} from "@/lib/motorista-viagem-actions";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { uploadDocumento } from "@/lib/supabase/storage";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { toast } from "sonner";
import { MotoristaFinalizarSheet, type FinalizarViagemPayload } from "./MotoristaFinalizarSheet";
import { useMotoristaSync } from "@/hooks/use-motorista-sync";
import { generateUuid } from "@/lib/uuid";

type Props = {
  viagem: Viagem;
  eventos: ViagemEvento[];
  motoristaId: string;
  motoristaNome: string;
  onUpdated?: (viagem: Viagem) => void;
};

function toastSync(result: "synced" | "queued", ok: string) {
  if (result === "queued") {
    toast.success(`${ok} — será enviado ao reconectar`);
  } else {
    toast.success(ok);
  }
}

export function MotoristaViagemAcoes({
  viagem,
  eventos,
  motoristaId,
  motoristaNome,
  onUpdated,
}: Props) {
  const qc = useQueryClient();
  const { syncViagemComEvento } = useMotoristaSync();
  const [finalizarOpen, setFinalizarOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const registrarGpsSeDisponivel = async () => {
    const pos = await requestMotoristaLocationOnce();
    if (!pos) return;
    const ts = new Date().toISOString();
    await motoristaSyncLocalizacao(
      {
        id: generateUuid(),
        transportadora_id: viagem.transportadora_id,
        viagem_id: viagem.id,
        motorista_id: motoristaId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        velocidade_kmh:
          pos.coords.speed != null ? Math.max(0, pos.coords.speed * 3.6) : undefined,
        precisao_metros: pos.coords.accuracy,
        heading: pos.coords.heading ?? undefined,
        registrado_em: ts,
        created_at: ts,
      },
      qc,
    );
  };

  if (!isViagemAtiva(viagem.status)) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Esta viagem já foi encerrada.
      </p>
    );
  }

  const acoes = getAcoesMotorista(viagem, eventos);
  const podeFinalizar = motoristaPodeFinalizar(viagem, eventos);

  const executarAcao = (acao: AcaoMotoristaViagem) => {
    void (async () => {
      setLoadingId(acao.id);
      const now = new Date().toISOString();
      const statusAnterior = viagem.status;
      const novoStatus =
        acao.id === "retomar" ? inferirStatusRetomar(viagem, eventos) : acao.novoStatus;

      const atualizada: Viagem = {
        ...viagem,
        status: novoStatus,
        updated_at: now,
        ...(acao.definirDataRealSaida && !viagem.data_real_saida ? { data_real_saida: now } : {}),
        ...(acao.definirDataRealChegada && !viagem.data_real_chegada ? { data_real_chegada: now } : {}),
      };

      try {
        if (
          acao.id === "iniciar_carregamento" ||
          acao.id === "sair_origem" ||
          acao.id === "chegada_destino" ||
          acao.id === "descarga_inicio"
        ) {
          await registrarGpsSeDisponivel();
        }

        const result = await syncViagemComEvento(atualizada, {
          id: generateUuid(),
          transportadora_id: viagem.transportadora_id,
          viagem_id: viagem.id,
          tipo: acao.tipoEvento,
          titulo: acao.tituloEvento,
          descricao: acao.descricaoEvento,
          status_anterior: statusAnterior,
          status_novo: novoStatus,
          origem: "motorista",
          motorista_id: motoristaId,
          created_at: now,
        });

        onUpdated?.(atualizada);
        toastSync(result, acao.tituloEvento);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.";
        toast.error(msg);
      } finally {
        setLoadingId(null);
      }
    })();
  };

  const finalizar = ({ observacao, fotos }: FinalizarViagemPayload) => {
    void (async () => {
      if (fotos.length > 0 && !isMotoristaOnline()) {
        toast.error("Conecte-se à internet para enviar fotos da entrega.");
        return;
      }

      setLoadingId("finalizar");
      const now = new Date().toISOString();
      const statusAnterior = viagem.status;

      try {
        let documentos: DocumentoAnexo[] = [...(viagem.documentos ?? [])];

        for (const file of fotos) {
          const { path } = await uploadDocumento({
            transportadoraId: viagem.transportadora_id,
            entidade: "viagens",
            entidadeId: viagem.id,
            file,
          });
          documentos.push({
            id: generateUuid(),
            tipo_documento: "Canhoto",
            nome_arquivo: file.name,
            arquivo_url: "",
            storage_path: path,
            mime_type: file.type || "image/jpeg",
            data_upload: now,
          });
        }

        const atualizada: Viagem = {
          ...viagem,
          status: "finalizada",
          documentos,
          data_real_chegada: viagem.data_real_chegada ?? now,
          finalizacao_origem: "motorista",
          finalizacao_em: now,
          finalizacao_por_nome: motoristaNome,
          finalizacao_motivo: observacao,
          updated_at: now,
        };

        const result = await syncViagemComEvento(atualizada, {
          id: generateUuid(),
          transportadora_id: viagem.transportadora_id,
          viagem_id: viagem.id,
          tipo: "viagem_finalizada",
          titulo: "Viagem finalizada pelo motorista",
          descricao: observacao
            ? `Entrega confirmada por ${motoristaNome}. ${observacao}`
            : `Entrega confirmada por ${motoristaNome}.`,
          status_anterior: statusAnterior,
          status_novo: "finalizada",
          origem: "motorista",
          motorista_id: motoristaId,
          created_at: now,
        });

        onUpdated?.(atualizada);
        setFinalizarOpen(false);
        toastSync(result, "Viagem finalizada!");
      } catch (err) {
        const msg =
          err instanceof Error ? traduzirErroSupabase(err) : "Não foi possível finalizar. Tente novamente.";
        toast.error(msg);
      } finally {
        setLoadingId(null);
      }
    })();
  };

  return (
    <div className="space-y-3">
      {acoes.map((acao) => (
        <Button
          key={acao.id}
          variant={acao.variant}
          size="lg"
          className="w-full h-auto py-3 flex flex-col items-start gap-0.5"
          disabled={!!loadingId}
          onClick={() => executarAcao(acao)}
        >
          <span>{acao.label}</span>
          {acao.descricao && (
            <span className="text-xs font-normal opacity-80">{acao.descricao}</span>
          )}
        </Button>
      ))}

      {podeFinalizar && (
        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          disabled={!!loadingId}
          onClick={() => setFinalizarOpen(true)}
        >
          Finalizar entrega
        </Button>
      )}

      <MotoristaFinalizarSheet
        open={finalizarOpen}
        onOpenChange={setFinalizarOpen}
        numeroViagem={viagem.numero_viagem}
        onConfirm={finalizar}
        loading={loadingId === "finalizar"}
      />
    </div>
  );
}
