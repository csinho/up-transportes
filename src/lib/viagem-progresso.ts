import type { Viagem, ViagemLocalizacao } from "@/types";
import type { LatLng } from "@/lib/geo-cidades";
import { getRotaEntreCidades } from "@/data/rotas-mock";
import { distanciaPolylineKm, progressoNaPolyline } from "@/lib/geo-utils";

export type ProgressoViagem = {
  percentualConcluido: number;
  distanciaTotalKm: number;
  distanciaPercorridaKm: number;
  distanciaRestanteKm: number;
  tempoTotalMinutos: number;
  tempoDecorridoMinutos: number;
  tempoRestanteMinutos: number;
  previsaoChegada: Date | null;
  previsaoChegadaAgendada: Date | null;
  atrasoMinutos: number | null;
  velocidadeMediaKmh: number | null;
  emAndamento: boolean;
  aguardandoInicio: boolean;
};

function minutosEntre(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

function parseDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatarDuracao(minutos: number): string {
  if (minutos < 1) return "menos de 1 min";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function calcularProgressoViagem(
  viagem: Viagem,
  localizacoes: ViagemLocalizacao[],
  agora = new Date(),
): ProgressoViagem {
  const origemCidade = viagem.endereco_origem.cidade;
  const destinoCidade = viagem.endereco_destino.cidade;
  const rota = getRotaEntreCidades(origemCidade, destinoCidade);
  const distanciaTotalKm = rota.km || distanciaPolylineKm(rota.points);

  const locs = localizacoes
    .filter((l) => l.viagem_id === viagem.id)
    .sort((a, b) => new Date(a.registrado_em).getTime() - new Date(b.registrado_em).getTime());

  const ultima = locs[locs.length - 1];
  const posicaoAtual: LatLng | undefined = ultima ? [ultima.latitude, ultima.longitude] : undefined;

  const finalizada = viagem.status === "finalizada";
  const cancelada = viagem.status === "cancelada";
  const planejada = viagem.status === "planejada";
  const emAndamento = !finalizada && !cancelada && !planejada;
  const aguardandoInicio =
    planejada ||
    viagem.status === "aguardando_carregamento" ||
    viagem.status === "em_carregamento";

  let percentualConcluido = 0;
  if (finalizada) {
    percentualConcluido = 100;
  } else if (posicaoAtual) {
    percentualConcluido = Math.round(progressoNaPolyline(rota.points, posicaoAtual) * 1000) / 10;
  } else if (viagem.status === "aguardando_carregamento" || viagem.status === "em_carregamento") {
    percentualConcluido = 2;
  }

  percentualConcluido = Math.max(0, Math.min(100, percentualConcluido));

  const distanciaPercorridaKm = Math.round(((distanciaTotalKm * percentualConcluido) / 100) * 10) / 10;
  const distanciaRestanteKm = Math.round((distanciaTotalKm - distanciaPercorridaKm) * 10) / 10;

  const saidaPrevista = parseDate(viagem.data_prevista_saida);
  const chegadaPrevista = parseDate(viagem.data_prevista_chegada);
  const saidaReal = parseDate(viagem.data_real_saida);
  const chegadaReal = parseDate(viagem.data_real_chegada);

  const tempoTotalMinutos =
    saidaPrevista && chegadaPrevista
      ? Math.max(1, minutosEntre(saidaPrevista, chegadaPrevista))
      : rota.min;

  const inicioViagem = saidaReal ?? saidaPrevista;
  const tempoDecorridoMinutos =
    finalizada && chegadaReal && inicioViagem
      ? minutosEntre(inicioViagem, chegadaReal)
      : inicioViagem && emAndamento
        ? Math.max(0, minutosEntre(inicioViagem, agora))
        : 0;

  let tempoRestanteMinutos = 0;
  if (finalizada) {
    tempoRestanteMinutos = 0;
  } else if (percentualConcluido >= 99) {
    tempoRestanteMinutos = viagem.status === "em_descarga" ? 0 : 5;
  } else if (percentualConcluido > 5 && tempoDecorridoMinutos > 0) {
    tempoRestanteMinutos = Math.round((tempoDecorridoMinutos * (100 - percentualConcluido)) / percentualConcluido);
  } else if (chegadaPrevista) {
    tempoRestanteMinutos = Math.max(0, minutosEntre(agora, chegadaPrevista));
  } else {
    tempoRestanteMinutos = rota.min;
  }

  const previsaoChegada =
    finalizada && chegadaReal
      ? chegadaReal
      : emAndamento
        ? new Date(agora.getTime() + tempoRestanteMinutos * 60000)
        : chegadaPrevista;

  const previsaoChegadaAgendada = chegadaPrevista;

  let atrasoMinutos: number | null = null;
  if (emAndamento && chegadaPrevista && previsaoChegada) {
    atrasoMinutos = minutosEntre(chegadaPrevista, previsaoChegada);
  } else if (finalizada && chegadaReal && chegadaPrevista) {
    atrasoMinutos = minutosEntre(chegadaPrevista, chegadaReal);
  }

  const velocidadeMediaKmh =
    tempoDecorridoMinutos > 0 && distanciaPercorridaKm > 0
      ? Math.round((distanciaPercorridaKm / (tempoDecorridoMinutos / 60)) * 10) / 10
      : (ultima?.velocidade_kmh ?? null);

  return {
    percentualConcluido,
    distanciaTotalKm,
    distanciaPercorridaKm,
    distanciaRestanteKm,
    tempoTotalMinutos,
    tempoDecorridoMinutos,
    tempoRestanteMinutos,
    previsaoChegada,
    previsaoChegadaAgendada,
    atrasoMinutos,
    velocidadeMediaKmh,
    emAndamento,
    aguardandoInicio,
  };
}

export function formatarDataHora(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
