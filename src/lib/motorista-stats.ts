import type { Viagem } from "@/types";
import { isViagemAtiva } from "@/lib/viagem-recursos";

export type ResumoMotorista = {
  viagensAtivas: number;
  viagensFinalizadas: number;
  viagensCanceladas: number;
  totalViagens: number;
  totalFreteRecebido: number;
  freteMedio: number;
  viagemAtual?: Viagem;
};

export function calcularResumoMotorista(viagens: Viagem[], motoristaId: string): ResumoMotorista {
  const minhas = viagens.filter((v) => v.motorista_id === motoristaId);
  const ativas = minhas.filter((v) => isViagemAtiva(v.status));
  const finalizadas = minhas.filter((v) => v.status === "finalizada");
  const canceladas = minhas.filter((v) => v.status === "cancelada");

  const totalFreteRecebido = finalizadas.reduce((s, v) => s + (v.valor_frete ?? 0), 0);
  const freteMedio = finalizadas.length > 0 ? totalFreteRecebido / finalizadas.length : 0;

  const viagemAtual = ativas.sort((a, b) => b.numero_viagem - a.numero_viagem)[0];

  return {
    viagensAtivas: ativas.length,
    viagensFinalizadas: finalizadas.length,
    viagensCanceladas: canceladas.length,
    totalViagens: minhas.length,
    totalFreteRecebido,
    freteMedio,
    viagemAtual,
  };
}
