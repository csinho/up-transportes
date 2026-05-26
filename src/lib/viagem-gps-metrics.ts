import type { ViagemLocalizacao } from "@/types";
import type { LatLng } from "@/lib/geo-cidades";
import { distanciaHaversineKm, distanciaPolylineKm } from "@/lib/geo-utils";

export function formatVelocidadeKmh(kmh: number | null | undefined): string {
  if (kmh == null || Number.isNaN(kmh)) return "—";
  return `${kmh.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`;
}

export function formatPrecisaoMetros(m: number | null | undefined): string {
  if (m == null || Number.isNaN(m)) return "—";
  return `${Math.round(m).toLocaleString("pt-BR")} m`;
}

export function ordenarLocalizacoesViagem(
  localizacoes: ViagemLocalizacao[],
  viagemId: string,
): ViagemLocalizacao[] {
  return localizacoes
    .filter((l) => l.viagem_id === viagemId)
    .sort((a, b) => new Date(a.registrado_em).getTime() - new Date(b.registrado_em).getTime());
}

export function localizacoesParaRota(locs: ViagemLocalizacao[]): LatLng[] {
  return locs.map((l) => [l.latitude, l.longitude]);
}

/** Soma Haversine entre pontos consecutivos do histórico GPS. */
export function distanciaPercorridaGpsKm(locs: ViagemLocalizacao[]): number {
  if (locs.length < 2) return 0;
  const pts = localizacoesParaRota(locs);
  return Math.round(distanciaPolylineKm(pts) * 10) / 10;
}

export function minutosEntreRegistros(locs: ViagemLocalizacao[]): number {
  if (locs.length < 2) return 0;
  const t0 = new Date(locs[0].registrado_em).getTime();
  const t1 = new Date(locs[locs.length - 1].registrado_em).getTime();
  if (Number.isNaN(t0) || Number.isNaN(t1) || t1 <= t0) return 0;
  return Math.max(1, Math.round((t1 - t0) / 60000));
}

/** Velocidade média: distância GPS / tempo entre primeiro e último ponto; fallback média dos speeds válidos. */
export function velocidadeMediaGps(locs: ViagemLocalizacao[]): number | null {
  const dist = distanciaPercorridaGpsKm(locs);
  const min = minutosEntreRegistros(locs);
  if (dist > 0 && min > 0) {
    return Math.round((dist / (min / 60)) * 10) / 10;
  }

  const speeds = locs
    .map((l) => l.velocidade_kmh)
    .filter((v): v is number => v != null && v > 0);
  if (speeds.length === 0) return null;
  const media = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  return Math.round(media * 10) / 10;
}

export function distanciaTotalEfetivaKm(
  distanciaPlanejadaKm: number,
  locs: ViagemLocalizacao[],
): number {
  const gpsKm = distanciaPercorridaGpsKm(locs);
  let extremosKm = 0;
  if (locs.length >= 2) {
    extremosKm = distanciaHaversineKm(
      [locs[0].latitude, locs[0].longitude],
      [locs[locs.length - 1].latitude, locs[locs.length - 1].longitude],
    );
  }
  const total = Math.max(distanciaPlanejadaKm, gpsKm, extremosKm);
  return Math.round(total * 10) / 10;
}
