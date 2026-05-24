/** Coordenadas aproximadas por cidade (mock / fallback até geocoding real). */
const COORDS: Record<string, [number, number]> = {
  "Belo Horizonte": [-19.9167, -43.9345],
  Salvador: [-12.971117, -38.512183],
  "Lauro de Freitas": [-12.894309, -38.322278],
  Maringá: [-23.4205, -51.9333],
  Pinhais: [-25.4442, -49.1925],
  Paranaguá: [-25.5163, -48.5225],
  Florianópolis: [-27.5954, -48.548],
  Curitiba: [-25.4284, -49.2733],
  Joinville: [-26.3045, -48.8487],
  "Campo Grande": [-20.4697, -54.6201],
  "Porto Alegre": [-30.0346, -51.2177],
  "Ponta Grossa": [-25.0916, -50.1668],
  Cascavel: [-24.9555, -53.4552],
  Guarulhos: [-23.4538, -46.5333],
  Londrina: [-23.3045, -51.1696],
  Blumenau: [-26.9194, -49.0661],
};

export type LatLng = [number, number];

function lookupCoord(cidade: string): [number, number] | undefined {
  const alvo = cidade.trim().toLowerCase();
  if (!alvo) return undefined;
  const entry = Object.entries(COORDS).find(([nome]) => nome.trim().toLowerCase() === alvo);
  return entry?.[1];
}

export function coordCidade(cidade: string): LatLng {
  return lookupCoord(cidade) ?? [-25.4284, -49.2733];
}

export function latLngFromEndereco(endereco: { cidade: string }): LatLng {
  return coordCidade(endereco.cidade);
}

export function cidadeTemCoordenada(cidade: string): boolean {
  return lookupCoord(cidade) != null;
}
