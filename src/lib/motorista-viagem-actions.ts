import type { StatusViagem, TipoViagemEvento, Viagem } from "@/types";

export type AcaoMotoristaViagem = {
  id: string;
  label: string;
  descricao?: string;
  variant: "default" | "outline" | "secondary";
  novoStatus: StatusViagem;
  tipoEvento: TipoViagemEvento;
  tituloEvento: string;
  descricaoEvento?: string;
  definirDataRealSaida?: boolean;
  definirDataRealChegada?: boolean;
};

export function getAcoesMotorista(viagem: Viagem): AcaoMotoristaViagem[] {
  switch (viagem.status) {
    case "planejada":
    case "aguardando_carregamento":
      return [
        {
          id: "iniciar_carregamento",
          label: "Iniciar carregamento",
          variant: "default",
          novoStatus: "em_carregamento",
          tipoEvento: "carregamento_inicio",
          tituloEvento: "Carregamento iniciado",
          descricaoEvento: "Motorista iniciou o carregamento na origem.",
        },
      ];
    case "em_carregamento":
      return [
        {
          id: "sair_origem",
          label: "Sair da origem",
          descricao: "Inicia o trânsito até o destino",
          variant: "default",
          novoStatus: "em_transito",
          tipoEvento: "saida_origem",
          tituloEvento: "Saída da origem",
          descricaoEvento: "Veículo saiu do ponto de origem.",
          definirDataRealSaida: true,
        },
      ];
    case "em_transito":
      return [
        {
          id: "chegada_destino",
          label: "Cheguei no destino",
          variant: "default",
          novoStatus: "em_descarga",
          tipoEvento: "chegada_destino",
          tituloEvento: "Chegada ao destino",
          descricaoEvento: "Motorista chegou ao ponto de descarga.",
          definirDataRealChegada: true,
        },
        {
          id: "parada",
          label: "Registrar parada",
          variant: "outline",
          novoStatus: "parada",
          tipoEvento: "parada",
          tituloEvento: "Parada registrada",
          descricaoEvento: "Viagem pausada pelo motorista.",
        },
      ];
    case "parada":
    case "com_ocorrencia":
      return [
        {
          id: "retomar",
          label: "Retomar viagem",
          variant: "default",
          novoStatus: "em_transito",
          tipoEvento: "retomada",
          tituloEvento: "Viagem retomada",
          descricaoEvento: "Motorista retomou o trânsito.",
        },
      ];
    case "em_descarga":
      return [
        {
          id: "descarga_fim",
          label: "Descarga concluída",
          descricao: "Confirme antes de finalizar a entrega",
          variant: "default",
          novoStatus: "em_descarga",
          tipoEvento: "descarga_fim",
          tituloEvento: "Descarga concluída",
          descricaoEvento: "Motorista concluiu a descarga no destino.",
        },
      ];
    default:
      return [];
  }
}

export function motoristaPodeFinalizar(status: StatusViagem): boolean {
  return ["em_transito", "parada", "em_descarga", "com_ocorrencia", "em_carregamento"].includes(status);
}
