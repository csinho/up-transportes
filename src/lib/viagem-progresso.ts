import type { Viagem, ViagemLocalizacao } from "@/types";
import type { LatLng } from "@/lib/geo-cidades";
import { getRotaEntreCidades } from "@/data/rotas-mock";
import { progressoNaPolyline } from "@/lib/geo-utils";
import {
  distanciaPercorridaGpsKm,
  distanciaTotalEfetivaKm,
  ordenarLocalizacoesViagem,
  velocidadeMediaGps,
} from "@/lib/viagem-gps-metrics";

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
  const distanciaPlanejadaKm = rota.km || 0;

  const locs = ordenarLocalizacoesViagem(localizacoes, viagem.id);
  const temHistoricoGps = locs.length >= 2;
  const distanciaGpsKm = distanciaPercorridaGpsKm(locs);
  const distanciaTotalKm = distanciaTotalEfetivaKm(distanciaPlanejadaKm, locs);

  const ultima = locs[locs.length - 1];
  const primeira = locs[0];
  const posicaoAtual: LatLng | undefined = ultima ? [ultima.latitude, ultima.longitude] : undefined;

  const finalizada = viagem.status === "finalizada";
  const cancelada = viagem.status === "cancelada";
  const planejada = viagem.status === "planejada";
  const emAndamento = !finalizada && !cancelada && !planejada;
  const aguardandoInicio =
    planejada ||
    viagem.status === "aguardando_carregamento" ||
    viagem.status === "em_carregamento";

  const saidaPrevista = parseDate(viagem.data_prevista_saida);
  const chegadaPrevista = parseDate(viagem.data_prevista_chegada);
  const saidaReal = parseDate(viagem.data_real_saida);
  const chegadaReal = parseDate(viagem.data_real_chegada);

  const inicioGps = primeira ? parseDate(primeira.registrado_em) : null;
  const fimGps = ultima ? parseDate(ultima.registrado_em) : null;
  const inicioViagem = saidaReal ?? inicioGps ?? saidaPrevista;

  let percentualConcluido = 0;
  if (finalizada) {
    percentualConcluido = 100;
  } else if (temHistoricoGps && distanciaTotalKm > 0) {
    percentualConcluido =
      Math.round((Math.min(distanciaGpsKm, distanciaTotalKm) / distanciaTotalKm) * 1000) / 10;
  } else if (posicaoAtual && rota.points.length >= 2) {
    percentualConcluido = Math.round(progressoNaPolyline(rota.points, posicaoAtual) * 1000) / 10;
  } else if (viagem.status === "aguardando_carregamento" || viagem.status === "em_carregamento") {
    percentualConcluido = 2;
  }

  percentualConcluido = Math.max(0, Math.min(100, percentualConcluido));

  let distanciaPercorridaKm: number;
  if (temHistoricoGps) {
    distanciaPercorridaKm =
      finalizada && distanciaTotalKm > 0
        ? Math.min(distanciaTotalKm, distanciaGpsKm)
        : distanciaGpsKm;
  } else {
    distanciaPercorridaKm = Math.round(((distanciaTotalKm * percentualConcluido) / 100) * 10) / 10;
  }

  const distanciaRestanteKm = Math.round(Math.max(0, distanciaTotalKm - distanciaPercorridaKm) * 10) / 10;

  const tempoTotalMinutos =
    saidaPrevista && chegadaPrevista
      ? Math.max(1, minutosEntre(saidaPrevista, chegadaPrevista))
      : rota.min;

  const tempoDecorridoMinutos =
    finalizada && chegadaReal && inicioViagem
      ? minutosEntre(inicioViagem, chegadaReal)
      : finalizada && fimGps && inicioViagem
        ? minutosEntre(inicioViagem, fimGps)
        : inicioViagem && emAndamento
          ? Math.max(0, minutosEntre(inicioViagem, agora))
          : 0;

  let tempoRestanteMinutos = 0;
  if (finalizada) {
    tempoRestanteMinutos = 0;
  } else if (percentualConcluido >= 99) {
    tempoRestanteMinutos = viagem.status === "em_descarga" || viagem.status === "aguardando_descarga" ? 0 : 5;
  } else if (percentualConcluido > 5 && tempoDecorridoMinutos > 0) {
    tempoRestanteMinutos = Math.round(
      (tempoDecorridoMinutos * (100 - percentualConcluido)) / percentualConcluido,
    );
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

  let velocidadeMediaKmh: number | null = null;
  if (temHistoricoGps) {
    velocidadeMediaKmh = velocidadeMediaGps(locs);
    if (
      velocidadeMediaKmh == null &&
      tempoDecorridoMinutos > 0 &&
      distanciaPercorridaKm > 0
    ) {
      velocidadeMediaKmh =
        Math.round((distanciaPercorridaKm / (tempoDecorridoMinutos / 60)) * 10) / 10;
    }
  } else if (tempoDecorridoMinutos > 0 && distanciaPercorridaKm > 0) {
    velocidadeMediaKmh =
      Math.round((distanciaPercorridaKm / (tempoDecorridoMinutos / 60)) * 10) / 10;
  } else {
    velocidadeMediaKmh = ultima?.velocidade_kmh ?? null;
  }

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
