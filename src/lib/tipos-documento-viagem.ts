export const TIPOS_DOCUMENTO_VIAGEM = [
  "NF-e",
  "DANFE",
  "CT-e",
  "DACTE",
  "MDF-e",
  "DAMDFE",
  "Nota Fiscal",
  "Romaneio",
  "Guia de transporte",
  "Ordem de coleta",
  "Ordem de carregamento",
  "Manifesto",
  "Comprovante de entrega",
  "Canhoto",
  "CNH",
  "CRLV",
  "Outro",
] as const;

export type TipoDocumentoViagem = (typeof TIPOS_DOCUMENTO_VIAGEM)[number];
