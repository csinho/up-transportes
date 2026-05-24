import type { LatLng } from "@/lib/geo-cidades";

const R = 6371;

export function distanciaHaversineKm(a: LatLng, b: LatLng): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const h = s1 * s1 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanciaPolylineKm(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanciaHaversineKm(points[i - 1], points[i]);
  }
  return total;
}

/** Amostra um ponto na polyline pelo progresso 0–1 (distância acumulada). */
export function pontoNaPolyline(points: LatLng[], progresso: number): LatLng {
  if (points.length === 0) return [0, 0];
  if (points.length === 1 || progresso <= 0) return points[0];
  if (progresso >= 1) return points[points.length - 1];

  const segmentos: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = distanciaHaversineKm(points[i - 1], points[i]);
    segmentos.push(d);
    total += d;
  }
  if (total === 0) return points[0];

  const alvo = progresso * total;
  let acum = 0;
  for (let i = 0; i < segmentos.length; i++) {
    const seg = segmentos[i];
    if (acum + seg >= alvo) {
      const t = seg === 0 ? 0 : (alvo - acum) / seg;
      const [lat1, lng1] = points[i];
      const [lat2, lng2] = points[i + 1];
      return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
    }
    acum += seg;
  }
  return points[points.length - 1];
}

/** Progresso 0–1 da posição atual ao longo da rota planejada. */
export function progressoNaPolyline(points: LatLng[], posicao: LatLng): number {
  if (points.length < 2) return 0;

  let melhorDist = Infinity;
  let melhorProgresso = 0;
  let acum = 0;
  let total = distanciaPolylineKm(points);

  if (total === 0) return 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLen = distanciaHaversineKm(a, b);
    const { t, dist } = projetarPontoSegmento(a, b, posicao);
    if (dist < melhorDist) {
      melhorDist = dist;
      melhorProgresso = (acum + segLen * t) / total;
    }
    acum += segLen;
  }

  return Math.max(0, Math.min(1, melhorProgresso));
}

function projetarPontoSegmento(a: LatLng, b: LatLng, p: LatLng): { t: number; dist: number } {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const [latP, lngP] = p;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((lngP - lng1) * dx + (latP - lat1) * dy) / len2));
  const latProj = lat1 + dy * t;
  const lngProj = lng1 + dx * t;
  return { t, dist: distanciaHaversineKm(p, [latProj, lngProj]) };
}
