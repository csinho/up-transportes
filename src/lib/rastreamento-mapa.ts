import type { Viagem, ViagemLocalizacao, Motorista, Veiculo, Cliente } from "@/types";
import { latLngFromEndereco, type LatLng } from "@/lib/geo-cidades";
import { getRotaEntreCidades } from "@/data/rotas-mock";
import { calcularProgressoViagem, type ProgressoViagem } from "@/lib/viagem-progresso";

export type DadosMapaViagem = {
  viagem: Viagem;
  motorista?: Motorista;
  veiculo?: Veiculo;
  clienteOrigem?: Cliente;
  clienteDestino?: Cliente;
  origem: LatLng;
  destino: LatLng;
  rotaPlanejada: LatLng[];
  rota: LatLng[];
  posicaoAtual?: LatLng;
  ultimaVelocidade?: number;
  progresso: ProgressoViagem;
};

export function montarDadosMapaViagem(
  viagem: Viagem,
  localizacoes: ViagemLocalizacao[],
  motorista?: Motorista,
  veiculo?: Veiculo,
  clienteOrigem?: Cliente,
  clienteDestino?: Cliente,
): DadosMapaViagem {
  const locs = localizacoes
    .filter((l) => l.viagem_id === viagem.id)
    .sort((a, b) => new Date(a.registrado_em).getTime() - new Date(b.registrado_em).getTime());

  const rota: LatLng[] = locs.map((l) => [l.latitude, l.longitude]);
  const ultima = locs[locs.length - 1];

  const rotaPlanejada = getRotaEntreCidades(
    viagem.endereco_origem.cidade,
    viagem.endereco_destino.cidade,
  ).points;

  const origem = rotaPlanejada[0] ?? latLngFromEndereco(viagem.endereco_origem);
  const destino = rotaPlanejada[rotaPlanejada.length - 1] ?? latLngFromEndereco(viagem.endereco_destino);

  const progresso = calcularProgressoViagem(viagem, locs);

  return {
    viagem,
    motorista,
    veiculo,
    clienteOrigem,
    clienteDestino,
    origem,
    destino,
    rotaPlanejada,
    rota,
    posicaoAtual: ultima ? [ultima.latitude, ultima.longitude] : undefined,
    ultimaVelocidade: ultima?.velocidade_kmh,
    progresso,
  };
}
