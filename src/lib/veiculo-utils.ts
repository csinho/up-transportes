import type { Motorista, Veiculo, Viagem } from "@/types";
import { isViagemAtiva } from "@/lib/viagem-recursos";

export type PapelVeiculo = "tracao" | "implemento";

export const PAPEIS_VEICULO: { value: PapelVeiculo; label: string; descricao: string }[] = [
  {
    value: "tracao",
    label: "Tração (veículo principal)",
    descricao: "Cavalo mecânico, truck, toco, bitruck — conduz a operação e puxa o implemento.",
  },
  {
    value: "implemento",
    label: "Implemento (reboque / carreta)",
    descricao: "Carreta, semirreboque, baú, tanque, graneleiro — acoplado ao veículo de tração.",
  },
];

const TIPOS_TRACAO = new Set([
  "Cavalo mecânico",
  "Cavalo mecânico simples",
  "Cavalo mecânico trucado",
  "Truck",
  "Toco",
  "Bitruck",
  "Bitrem",
  "Rodotrem",
  "Munck",
  "Outro",
]);

const TIPOS_IMPLEMENTO = new Set([
  "Carreta",
  "Semirreboque",
  "Reboque",
  "Baú",
  "Sider",
  "Graneleiro",
  "Caçamba",
  "Basculante",
  "Prancha",
  "Tanque",
  "Frigorífico",
  "Plataforma",
  "Grade baixa",
  "Cegonha",
  "Porta-container",
  "Roll-on/Roll-off",
  "Vanderleia",
]);

export function inferirPapelVeiculo(tipoVeiculo: string): PapelVeiculo {
  if (TIPOS_IMPLEMENTO.has(tipoVeiculo)) return "implemento";
  if (TIPOS_TRACAO.has(tipoVeiculo)) return "tracao";
  return "tracao";
}

export function getPapelVeiculo(veiculo: Pick<Veiculo, "papel_veiculo" | "tipo_veiculo">): PapelVeiculo {
  return veiculo.papel_veiculo ?? inferirPapelVeiculo(veiculo.tipo_veiculo);
}

export function tiposVeiculoPorPapel(papel: PapelVeiculo): string[] {
  const set = papel === "tracao" ? TIPOS_TRACAO : TIPOS_IMPLEMENTO;
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function labelPapelVeiculo(papel: PapelVeiculo): string {
  return PAPEIS_VEICULO.find((p) => p.value === papel)?.label ?? papel;
}

/** Pode ser alocado em nova viagem (status operacional). */
export function veiculoAptoParaAlocacao(veiculo: Veiculo): boolean {
  return veiculo.status === "disponivel";
}

export function syncStatusRecursos(motoristas: Motorista[], veiculos: Veiculo[], viagens: Viagem[]) {
  const motoristasEmViagem = new Set<string>();
  const veiculosEmViagem = new Set<string>();

  viagens.forEach((v) => {
    if (!isViagemAtiva(v.status)) return;
    if (v.motorista_id) motoristasEmViagem.add(v.motorista_id);
    if (v.veiculo_principal_id) veiculosEmViagem.add(v.veiculo_principal_id);
    if (v.veiculo_reboque_id) veiculosEmViagem.add(v.veiculo_reboque_id);
  });

  motoristas.forEach((m) => {
    if (m.status === "bloqueado" || m.status === "inativo") return;
    m.status = motoristasEmViagem.has(m.id) ? "em_viagem" : "disponivel";
  });

  veiculos.forEach((v) => {
    if (v.status === "inativo" || v.status === "bloqueado") return;
    if (veiculosEmViagem.has(v.id)) {
      v.status = "em_viagem";
    } else if (v.status !== "em_manutencao") {
      v.status = "disponivel";
    }
  });
}

export function normalizarVeiculos(veiculos: Veiculo[]): Veiculo[] {
  return veiculos.map((v) => ({
    ...v,
    papel_veiculo: v.papel_veiculo ?? inferirPapelVeiculo(v.tipo_veiculo),
  }));
}

/** Status que o operador define manualmente no cadastro (não inclui em_viagem). */
export const STATUS_VEICULO_EDITAVEL = [
  { value: "disponivel" as const, label: "Disponível" },
  { value: "em_manutencao" as const, label: "Em manutenção" },
  { value: "inativo" as const, label: "Inativo" },
  { value: "bloqueado" as const, label: "Bloqueado" },
];

export const STATUS_MOTORISTA_EDITAVEL = [
  { value: "ativo" as const, label: "Ativo" },
  { value: "disponivel" as const, label: "Disponível" },
  { value: "inativo" as const, label: "Inativo" },
  { value: "bloqueado" as const, label: "Bloqueado" },
];
