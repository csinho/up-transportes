/**
 * Perfis de vista superior de pneus por tipo de veículo.
 *
 * Referências (Brasil):
 * - Toco 4×2: 1 eixo direcional (rodagem simples) + 1 traseiro duplo (tração)
 * - Truck 6×2/6×4: 1 direcional + 2 traseiros duplos (tandem)
 * - Bitruck 8×2/8×4: 2 eixos dianteiros direcionais + 2 traseiros duplos
 * - Cavalo 4×2: 1 direcional + 1 traseiro duplo (sem carroceria longa)
 * - Cavalo 6×4: 1 direcional + 2 traseiros duplos (tração)
 * - Implementos: sem eixo dianteiro; 2–3 eixos traseiros duplos (tandem triplo)
 * - Vanderleia: eixos distanciados ~2,40 m entre conjuntos
 */
import type { PosicaoPneu, Veiculo } from "@/types";

export type TipoChassiPneus =
  | "rigido_2"
  | "rigido_3"
  | "rigido_4"
  | "trator_2"
  | "trator_3"
  | "implemento_2"
  | "implemento_3"
  | "implemento_vanderleia";

export type CorpoVariant = "cabine" | "carroceria" | "engate" | "pescoco" | "quinta_roda";

export type FaixaLayout =
  | { tipo: "eixo"; posicoes: PosicaoPneu[]; titulo: string; dual: boolean }
  | { tipo: "corpo"; rotulo: string; variant: CorpoVariant; altura?: "sm" | "md" | "lg" }
  | { tipo: "espacador"; rotulo: string }
  | { tipo: "estepe"; alinhamento?: "esquerda" | "direita" | "centro" };

export interface PerfilLayoutPneus {
  chassi: TipoChassiPneus;
  titulo: string;
  descricao: string;
  eixosPadrao: number;
  faixas: FaixaLayout[];
}

const D = {
  dianteiro: ["dianteiro_esq", "dianteiro_dir"] as PosicaoPneu[],
  dianteiro2: ["dianteiro2_esq", "dianteiro2_dir"] as PosicaoPneu[],
  eixo2: ["eixo2_esq_externo", "eixo2_esq_interno", "eixo2_dir_interno", "eixo2_dir_externo"] as PosicaoPneu[],
  eixo3: ["eixo3_esq_externo", "eixo3_esq_interno", "eixo3_dir_interno", "eixo3_dir_externo"] as PosicaoPneu[],
  eixo4: ["eixo4_esq_externo", "eixo4_esq_interno", "eixo4_dir_interno", "eixo4_dir_externo"] as PosicaoPneu[],
  estepe: ["estepe"] as PosicaoPneu[],
};

const IMPLEMENTOS_CARROCERIA = [
  "Baú", "Sider", "Graneleiro", "Caçamba", "Basculante", "Prancha", "Tanque",
  "Frigorífico", "Munck", "Plataforma", "Grade baixa", "Cegonha", "Porta-container",
  "Roll-on/Roll-off",
] as const;

const MAPA_TIPO: Record<string, TipoChassiPneus> = {
  Toco: "rigido_2",
  Truck: "rigido_3",
  Bitruck: "rigido_4",
  "Cavalo mecânico simples": "trator_2",
  "Cavalo mecânico trucado": "trator_3",
  "Cavalo mecânico": "trator_3",
  Carreta: "implemento_3",
  Semirreboque: "implemento_3",
  Reboque: "implemento_2",
  Vanderleia: "implemento_vanderleia",
  Bitrem: "implemento_2",
  Rodotrem: "implemento_3",
  Outro: "rigido_3",
  ...Object.fromEntries(IMPLEMENTOS_CARROCERIA.map((t) => [t, "implemento_3" as TipoChassiPneus])),
};

function perfilRigido2(): PerfilLayoutPneus {
  return {
    chassi: "rigido_2",
    titulo: "Toco 4×2",
    descricao: "1 eixo direcional (simples) + 1 traseiro duplo (tração)",
    eixosPadrao: 2,
    faixas: [
      { tipo: "eixo", posicoes: D.dianteiro, titulo: "Eixo 1 — Direcional", dual: false },
      { tipo: "corpo", rotulo: "Carroceria", variant: "carroceria", altura: "md" },
      { tipo: "eixo", posicoes: D.eixo2, titulo: "Eixo 2 — Tração (duplo)", dual: true },
      { tipo: "estepe", alinhamento: "direita" },
    ],
  };
}

function perfilRigido3(): PerfilLayoutPneus {
  return {
    chassi: "rigido_3",
    titulo: "Truck 6×2 / 6×4",
    descricao: "1 eixo direcional + 2 traseiros duplos (tandem)",
    eixosPadrao: 3,
    faixas: [
      { tipo: "eixo", posicoes: D.dianteiro, titulo: "Eixo 1 — Direcional", dual: false },
      { tipo: "corpo", rotulo: "Carroceria", variant: "carroceria", altura: "md" },
      { tipo: "eixo", posicoes: D.eixo2, titulo: "Eixo 2 — Traseiro (duplo)", dual: true },
      { tipo: "eixo", posicoes: D.eixo3, titulo: "Eixo 3 — Traseiro (duplo)", dual: true },
      { tipo: "estepe", alinhamento: "direita" },
    ],
  };
}

function perfilRigido4(): PerfilLayoutPneus {
  return {
    chassi: "rigido_4",
    titulo: "Bitruck 8×2 / 8×4",
    descricao: "2 eixos dianteiros direcionais + 2 traseiros duplos",
    eixosPadrao: 4,
    faixas: [
      { tipo: "eixo", posicoes: D.dianteiro, titulo: "Eixo 1 — Direcional", dual: false },
      { tipo: "eixo", posicoes: D.dianteiro2, titulo: "Eixo 2 — Direcional / tag", dual: false },
      { tipo: "corpo", rotulo: "Carroceria", variant: "carroceria", altura: "md" },
      { tipo: "eixo", posicoes: D.eixo3, titulo: "Eixo 3 — Traseiro (duplo)", dual: true },
      { tipo: "eixo", posicoes: D.eixo4, titulo: "Eixo 4 — Traseiro / tração (duplo)", dual: true },
      { tipo: "estepe", alinhamento: "direita" },
    ],
  };
}

function perfilTrator2(): PerfilLayoutPneus {
  return {
    chassi: "trator_2",
    titulo: "Cavalo 4×2",
    descricao: "1 eixo direcional + 1 traseiro duplo (tração)",
    eixosPadrao: 2,
    faixas: [
      { tipo: "eixo", posicoes: D.dianteiro, titulo: "Eixo 1 — Direcional", dual: false },
      { tipo: "corpo", rotulo: "Cabine / chassi", variant: "cabine", altura: "sm" },
      { tipo: "eixo", posicoes: D.eixo2, titulo: "Eixo 2 — Tração (duplo)", dual: true },
      { tipo: "corpo", rotulo: "Quinta-roda", variant: "quinta_roda", altura: "sm" },
      { tipo: "estepe", alinhamento: "esquerda" },
    ],
  };
}

function perfilTrator3(): PerfilLayoutPneus {
  return {
    chassi: "trator_3",
    titulo: "Cavalo 6×4",
    descricao: "1 eixo direcional + 2 traseiros duplos (tração)",
    eixosPadrao: 3,
    faixas: [
      { tipo: "eixo", posicoes: D.dianteiro, titulo: "Eixo 1 — Direcional", dual: false },
      { tipo: "corpo", rotulo: "Cabine / chassi", variant: "cabine", altura: "sm" },
      { tipo: "eixo", posicoes: D.eixo2, titulo: "Eixo 2 — Tração (duplo)", dual: true },
      { tipo: "eixo", posicoes: D.eixo3, titulo: "Eixo 3 — Tração (duplo)", dual: true },
      { tipo: "corpo", rotulo: "Quinta-roda", variant: "quinta_roda", altura: "sm" },
      { tipo: "estepe", alinhamento: "esquerda" },
    ],
  };
}

function perfilImplemento2(): PerfilLayoutPneus {
  return {
    chassi: "implemento_2",
    titulo: "Implemento 2 eixos",
    descricao: "Sem eixo dianteiro — 2 eixos traseiros duplos (tandem)",
    eixosPadrao: 2,
    faixas: [
      { tipo: "corpo", rotulo: "Pino rei / engate", variant: "engate", altura: "sm" },
      { tipo: "corpo", rotulo: "Plataforma / carroceria", variant: "carroceria", altura: "lg" },
      { tipo: "eixo", posicoes: D.eixo2, titulo: "Eixo 1 — Implemento (duplo)", dual: true },
      { tipo: "eixo", posicoes: D.eixo3, titulo: "Eixo 2 — Implemento (duplo)", dual: true },
      { tipo: "estepe", alinhamento: "centro" },
    ],
  };
}

function perfilImplemento3(): PerfilLayoutPneus {
  return {
    chassi: "implemento_3",
    titulo: "Carreta / Semirreboque 3 eixos",
    descricao: "Tandem triplo — 3 eixos traseiros duplos",
    eixosPadrao: 3,
    faixas: [
      { tipo: "corpo", rotulo: "Pino rei / engate", variant: "engate", altura: "sm" },
      { tipo: "corpo", rotulo: "Pescoço + carroceria", variant: "pescoco", altura: "lg" },
      { tipo: "eixo", posicoes: D.eixo2, titulo: "Eixo 1 — Implemento (duplo)", dual: true },
      { tipo: "eixo", posicoes: D.eixo3, titulo: "Eixo 2 — Implemento (duplo)", dual: true },
      { tipo: "eixo", posicoes: D.eixo4, titulo: "Eixo 3 — Implemento (duplo)", dual: true },
      { tipo: "estepe", alinhamento: "centro" },
    ],
  };
}

function perfilVanderleia(): PerfilLayoutPneus {
  return {
    chassi: "implemento_vanderleia",
    titulo: "Vanderleia (eixos distanciados)",
    descricao: "Eixos com distanciamento ~2,40 m entre conjuntos",
    eixosPadrao: 3,
    faixas: [
      { tipo: "corpo", rotulo: "Pino rei / engate", variant: "engate", altura: "sm" },
      { tipo: "corpo", rotulo: "Pescoço", variant: "pescoco", altura: "md" },
      { tipo: "eixo", posicoes: D.eixo2, titulo: "Eixo 1 — Direcional / livre", dual: true },
      { tipo: "espacador", rotulo: "Distância ~2,40 m" },
      { tipo: "eixo", posicoes: D.eixo3, titulo: "Eixo 2 — Livre (duplo)", dual: true },
      { tipo: "espacador", rotulo: "Distância ~2,40 m" },
      { tipo: "eixo", posicoes: D.eixo4, titulo: "Eixo 3 — Livre (duplo)", dual: true },
      { tipo: "estepe", alinhamento: "centro" },
    ],
  };
}

const PERFIS: Record<TipoChassiPneus, PerfilLayoutPneus> = {
  rigido_2: perfilRigido2(),
  rigido_3: perfilRigido3(),
  rigido_4: perfilRigido4(),
  trator_2: perfilTrator2(),
  trator_3: perfilTrator3(),
  implemento_2: perfilImplemento2(),
  implemento_3: perfilImplemento3(),
  implemento_vanderleia: perfilVanderleia(),
};

export function chassiPorTipoVeiculo(tipo: string): TipoChassiPneus {
  return MAPA_TIPO[tipo] ?? "rigido_3";
}

export function perfilLayoutPneus(tipo: string): PerfilLayoutPneus {
  return PERFIS[chassiPorTipoVeiculo(tipo)];
}

export function faixasAjustadas(perfil: PerfilLayoutPneus, numeroEixos?: number): FaixaLayout[] {
  const alvo = numeroEixos ?? perfil.eixosPadrao;
  const faixasEixo = perfil.faixas.filter((f): f is Extract<FaixaLayout, { tipo: "eixo" }> => f.tipo === "eixo");

  if (faixasEixo.length === 0 || alvo >= faixasEixo.length) return perfil.faixas;

  const manter = new Set(faixasEixo.slice(0, Math.max(1, alvo)).flatMap((f) => f.posicoes));
  return perfil.faixas.filter((f) => {
    if (f.tipo !== "eixo") return true;
    return f.posicoes.some((p) => manter.has(p));
  });
}

export function posicoesAtivasVeiculo(veiculo: Pick<Veiculo, "tipo_veiculo" | "numero_eixos">): PosicaoPneu[] {
  const faixas = faixasAjustadas(perfilLayoutPneus(veiculo.tipo_veiculo), veiculo.numero_eixos);
  const pos: PosicaoPneu[] = [];
  for (const f of faixas) {
    if (f.tipo === "eixo") pos.push(...f.posicoes);
    if (f.tipo === "estepe") pos.push(...D.estepe);
  }
  return pos;
}

export function layoutVisualVeiculo(veiculo: Pick<Veiculo, "tipo_veiculo" | "numero_eixos">) {
  const perfil = perfilLayoutPneus(veiculo.tipo_veiculo);
  return { perfil, faixas: faixasAjustadas(perfil, veiculo.numero_eixos) };
}

export function eixosPadraoPorTipo(tipo: string): number {
  return perfilLayoutPneus(tipo).eixosPadrao;
}
