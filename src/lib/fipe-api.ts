export type FipeCategoria = "carros" | "motos" | "caminhoes";

export type FipeMarca = { codigo: string; nome: string };
export type FipeModelo = { codigo: number; nome: string };
export type FipeAno = { codigo: string; nome: string };

const BASE_URL = "https://parallelum.com.br/fipe/api/v1";

async function fipeFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`FIPE indisponível (${res.status})`);
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data;
}

export function listarMarcasFipe(categoria: FipeCategoria = "caminhoes") {
  return fipeFetch<FipeMarca[]>(`/${categoria}/marcas`);
}

export function listarModelosFipe(categoria: FipeCategoria, marcaCodigo: string) {
  return fipeFetch<{ modelos: FipeModelo[] }>(`/${categoria}/marcas/${marcaCodigo}/modelos`);
}

export function listarAnosFipe(
  categoria: FipeCategoria,
  marcaCodigo: string,
  modeloCodigo: string | number,
) {
  return fipeFetch<FipeAno[]>(`/${categoria}/marcas/${marcaCodigo}/modelos/${modeloCodigo}/anos`);
}

export function parseAnoFipe(nome: string): number {
  return Number.parseInt(nome, 10);
}

/** Mesmo ano pode aparecer com códigos distintos (combustível). Mantém um por ano. */
export function deduplicarAnosFipe(anos: FipeAno[]): FipeAno[] {
  const porAno = new Map<number, FipeAno>();
  for (const item of anos) {
    const ano = parseAnoFipe(item.nome);
    if (!Number.isFinite(ano)) continue;
    const atual = porAno.get(ano);
    if (!atual || item.codigo.endsWith("-7")) porAno.set(ano, item);
  }
  return [...porAno.values()].sort((a, b) => parseAnoFipe(b.nome) - parseAnoFipe(a.nome));
}

export function acharMarcaPorNome(marcas: FipeMarca[], nome?: string) {
  if (!nome) return undefined;
  const alvo = nome.trim().toLowerCase();
  return marcas.find((m) => m.nome.toLowerCase() === alvo);
}

export function acharModeloPorNome(modelos: FipeModelo[], nome?: string) {
  if (!nome) return undefined;
  const alvo = nome.trim().toLowerCase();
  return modelos.find((m) => m.nome.toLowerCase() === alvo);
}
