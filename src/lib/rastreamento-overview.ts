import type { Viagem, ViagemLocalizacao, Motorista, Veiculo } from "@/types";
import type { LatLng } from "@/lib/geo-cidades";
import { STATUS_VIAGEM } from "@/types";

export type MarcadorViagemOverview = {
  viagemId: string;
  numeroViagem: number;
  posicao: LatLng;
  temGps: boolean;
  motorista?: string;
  placa?: string;
  statusLabel: string;
  velocidade?: number;
  registradoEm?: string;
};

export function listarMarcadoresRastreaveis(
  viagens: Viagem[],
  localizacoes: ViagemLocalizacao[],
  motoristas: Motorista[],
  veiculos: Veiculo[],
): MarcadorViagemOverview[] {
  return viagens
    .map((v) => {
      const locs = localizacoes
        .filter((l) => l.viagem_id === v.id)
        .sort((a, b) => new Date(a.registrado_em).getTime() - new Date(b.registrado_em).getTime());
      const ultima = locs[locs.length - 1];
      if (!ultima) return null;

      const m = motoristas.find((x) => x.id === v.motorista_id);
      const ve = veiculos.find((x) => x.id === v.veiculo_principal_id);

      return {
        viagemId: v.id,
        numeroViagem: v.numero_viagem,
        posicao: [ultima.latitude, ultima.longitude] as LatLng,
        temGps: true,
        motorista: m?.nome,
        placa: ve?.placa,
        statusLabel: STATUS_VIAGEM.find((s) => s.value === v.status)?.label ?? v.status,
        velocidade: ultima.velocidade_kmh,
        registradoEm: ultima.registrado_em,
      };
    })
    .filter((m): m is MarcadorViagemOverview => m != null);
}
