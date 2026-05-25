import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { Viagem } from "@/types";
import { requestMotoristaLocationOnce } from "@/lib/motorista-geolocation";
import { motoristaSyncLocalizacao } from "@/lib/motorista-sync";
import {
  getAcoesMotorista,
  motoristaPodeFinalizar,
  type AcaoMotoristaViagem,
} from "@/lib/motorista-viagem-actions";
import { isViagemAtiva } from "@/lib/viagem-recursos";
import { toast } from "sonner";
import { MotoristaFinalizarSheet } from "./MotoristaFinalizarSheet";
import { useMotoristaSync } from "@/hooks/use-motorista-sync";
import { generateUuid } from "@/lib/uuid";

type Props = {
  viagem: Viagem;
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

export function MotoristaViagemAcoes({ viagem, motoristaId, motoristaNome, onUpdated }: Props) {
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

  const acoes = getAcoesMotorista(viagem);
  const podeFinalizar = motoristaPodeFinalizar(viagem.status);

  const executarAcao = (acao: AcaoMotoristaViagem) => {
    void (async () => {
      setLoadingId(acao.id);
      const now = new Date().toISOString();
      const statusAnterior = viagem.status;

      const atualizada: Viagem = {
        ...viagem,
        status: acao.novoStatus,
        updated_at: now,
        ...(acao.definirDataRealSaida && !viagem.data_real_saida ? { data_real_saida: now } : {}),
        ...(acao.definirDataRealChegada && !viagem.data_real_chegada ? { data_real_chegada: now } : {}),
      };

      try {
        if (acao.id === "iniciar_carregamento" || acao.id === "sair_origem") {
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
          status_novo: acao.novoStatus,
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

  const finalizar = (observacao?: string) => {
    void (async () => {
      setLoadingId("finalizar");
      const now = new Date().toISOString();
      const statusAnterior = viagem.status;

      const atualizada: Viagem = {
        ...viagem,
        status: "finalizada",
        data_real_chegada: viagem.data_real_chegada ?? now,
        finalizacao_origem: "motorista",
        finalizacao_em: now,
        finalizacao_por_nome: motoristaNome,
        finalizacao_motivo: observacao,
        updated_at: now,
      };

      try {
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
        const msg = err instanceof Error ? err.message : "Não foi possível finalizar. Tente novamente.";
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
        loading={!!loadingId}
      />
    </div>
  );
}
