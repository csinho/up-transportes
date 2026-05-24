import type { Viagem, Motorista, Veiculo, UUID } from "@/types";
import { getPapelVeiculo, veiculoAptoParaAlocacao, type PapelVeiculo } from "@/lib/veiculo-utils";

export const STATUS_VIAGEM_ENCERRADA = ["finalizada", "cancelada"] as const;

export function isViagemAtiva(status: Viagem["status"]): boolean {
  return !STATUS_VIAGEM_ENCERRADA.includes(status as (typeof STATUS_VIAGEM_ENCERRADA)[number]);
}

export type RecursosOcupados = {
  motoristaIds: Set<UUID>;
  veiculoIds: Set<UUID>;
};

export function getRecursosOcupados(viagens: Viagem[], excluirViagemId?: UUID): RecursosOcupados {
  const motoristaIds = new Set<UUID>();
  const veiculoIds = new Set<UUID>();

  viagens.forEach((v) => {
    if (!isViagemAtiva(v.status)) return;
    if (excluirViagemId && v.id === excluirViagemId) return;
    if (v.motorista_id) motoristaIds.add(v.motorista_id);
    if (v.veiculo_principal_id) veiculoIds.add(v.veiculo_principal_id);
    if (v.veiculo_reboque_id) veiculoIds.add(v.veiculo_reboque_id);
  });

  return { motoristaIds, veiculoIds };
}

export function filtrarMotoristasDisponiveis(
  motoristas: Motorista[],
  viagens: Viagem[],
  excluirViagemId?: UUID,
): Motorista[] {
  const { motoristaIds } = getRecursosOcupados(viagens, excluirViagemId);
  return motoristas.filter((m) => !motoristaIds.has(m.id));
}

export function filtrarVeiculosDisponiveis(
  veiculos: Veiculo[],
  viagens: Viagem[],
  excluirViagemId?: UUID,
  excluirVeiculoIds: UUID[] = [],
  papel?: PapelVeiculo,
): Veiculo[] {
  const { veiculoIds } = getRecursosOcupados(viagens, excluirViagemId);
  const bloqueados = new Set([...veiculoIds, ...excluirVeiculoIds.filter(Boolean)]);

  return veiculos.filter((v) => {
    if (bloqueados.has(v.id)) return false;
    if (!veiculoAptoParaAlocacao(v)) return false;
    if (papel && getPapelVeiculo(v) !== papel) return false;
    return true;
  });
}

export function recursoOcupadoEmViagem(
  viagens: Viagem[],
  opts: { motoristaId?: UUID; veiculoId?: UUID; excluirViagemId?: UUID },
): Viagem | undefined {
  return viagens.find((v) => {
    if (!isViagemAtiva(v.status)) return false;
    if (opts.excluirViagemId && v.id === opts.excluirViagemId) return false;
    if (opts.motoristaId && v.motorista_id === opts.motoristaId) return true;
    if (opts.veiculoId) {
      return v.veiculo_principal_id === opts.veiculoId || v.veiculo_reboque_id === opts.veiculoId;
    }
    return false;
  });
}
