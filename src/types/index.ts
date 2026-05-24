// Tipos espelhando o schema sugerido para Supabase.
// Mantenha em sincronia com docs/modelo-dados.md.

export type UUID = string;
export type ISODate = string;

export type TipoTransportador = "TAC" | "ETC" | "CTC";

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  codigo_ibge?: string;
  pais?: string;
}

export interface DocumentoAnexo {
  id: UUID;
  tipo_documento: string;
  nome_arquivo: string;
  arquivo_url: string;
  /** Path no bucket Supabase `documentos` (privado). */
  storage_path?: string;
  mime_type?: string;
  data_upload: ISODate;
  data_emissao?: ISODate;
  data_validade?: ISODate;
  observacoes?: string;
  numero_documento?: string;
  serie?: string;
  chave_acesso?: string;
}

export interface Transportadora {
  id: UUID;
  logo_url?: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj?: string;
  cpf?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  rntrc?: string;
  tipo_transportador: TipoTransportador;
  telefone_principal?: string;
  telefone_secundario?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_cargo?: string;
  endereco: Endereco;
  observacoes?: string;
  documentos: DocumentoAnexo[];
  created_at: ISODate;
  updated_at: ISODate;
}

export type StatusMotorista = "ativo" | "inativo" | "em_viagem" | "disponivel" | "bloqueado";

export interface CNH {
  numero: string;
  categoria: string;
  data_emissao?: ISODate;
  data_validade?: ISODate;
  uf?: string;
  orgao_emissor?: string;
  ear?: boolean;
  observacoes?: string;
}

export interface Motorista {
  id: UUID;
  transportadora_id: UUID;
  foto_url?: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento?: ISODate;
  telefone_principal?: string;
  telefone_secundario?: string;
  whatsapp?: string;
  email?: string;
  endereco: Endereco;
  cnh: CNH;
  status: StatusMotorista;
  observacoes?: string;
  documentos: DocumentoAnexo[];
  created_at: ISODate;
  updated_at: ISODate;
}

export type StatusVeiculo = "disponivel" | "em_viagem" | "em_manutencao" | "inativo" | "bloqueado";

export const TIPOS_VEICULO = [
  "Cavalo mecânico",
  "Cavalo mecânico simples",
  "Cavalo mecânico trucado",
  "Carreta",
  "Semirreboque",
  "Reboque",
  "Truck",
  "Toco",
  "Bitruck",
  "Bitrem",
  "Rodotrem",
  "Vanderleia",
  "Baú",
  "Sider",
  "Graneleiro",
  "Caçamba",
  "Basculante",
  "Prancha",
  "Tanque",
  "Frigorífico",
  "Munck",
  "Plataforma",
  "Grade baixa",
  "Cegonha",
  "Porta-container",
  "Roll-on/Roll-off",
  "Outro",
] as const;

export type PapelVeiculo = "tracao" | "implemento";

export interface Veiculo {
  id: UUID;
  transportadora_id: UUID;
  /** Tração = cabine/cavalo (viagem principal). Implemento = reboque/carreta acoplado. */
  papel_veiculo?: PapelVeiculo;
  tipo_veiculo: string;
  identificacao_interna?: string;
  marca?: string;
  modelo?: string;
  ano_fabricacao?: number;
  ano_modelo?: number;
  cor?: string;
  placa: string;
  renavam: string;
  chassi: string;
  numero_motor?: string;
  rntrc?: string;
  tara?: number;
  capacidade_carga?: number;
  peso_bruto_total?: number;
  numero_eixos?: number;
  tipo_carroceria?: string;
  tipo_combustivel?: string;
  hodometro_atual?: number;
  status: StatusVeiculo;
  observacoes?: string;
  documentos: DocumentoAnexo[];
  created_at: ISODate;
  updated_at: ISODate;
}

export type TipoCliente = "PF" | "PJ";

export interface Cliente {
  id: UUID;
  transportadora_id: UUID;
  tipo_cliente: TipoCliente;
  nome: string;
  nome_fantasia?: string;
  razao_social?: string;
  cpf?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  telefone_principal?: string;
  telefone_secundario?: string;
  whatsapp?: string;
  email?: string;
  contato_responsavel?: string;
  cargo_contato?: string;
  endereco: Endereco;
  observacoes?: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export const UNIDADES_MEDIDA = ["kg", "ton", "m³", "litro", "unidade", "palete"] as const;
export type UnidadeMedida = (typeof UNIDADES_MEDIDA)[number];

export const CATEGORIAS_PRODUTO = [
  "Minério",
  "Minério seco",
  "Minério úmido",
  "Chapa",
  "Grãos",
  "Soja",
  "Milho",
  "Farelo",
  "Fertilizantes",
  "Areia",
  "Brita",
  "Cimento",
  "Cal",
  "Madeira",
  "Aço",
  "Bobinas",
  "Máquinas",
  "Equipamentos",
  "Carga seca",
  "Carga a granel",
  "Carga líquida",
  "Carga frigorificada",
  "Carga perigosa",
  "Produto químico",
  "Combustível",
  "Contêiner",
  "Paletizados",
  "Alimentos",
  "Bebidas",
  "Outros",
] as const;

export interface ProdutoCarga {
  id: UUID;
  transportadora_id: UUID;
  nome: string;
  categoria: string;
  descricao?: string;
  unidade_medida: UnidadeMedida;
  ncm?: string;
  produto_perigoso: boolean;
  codigo_onu?: string;
  classe_risco?: string;
  status: "ativo" | "inativo";
  observacoes?: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export type StatusViagem =
  | "planejada"
  | "aguardando_carregamento"
  | "em_carregamento"
  | "em_transito"
  | "parada"
  | "em_descarga"
  | "finalizada"
  | "cancelada"
  | "com_ocorrencia";

export const STATUS_VIAGEM: { value: StatusViagem; label: string }[] = [
  { value: "planejada", label: "Planejada" },
  { value: "aguardando_carregamento", label: "Aguardando carregamento" },
  { value: "em_carregamento", label: "Em carregamento" },
  { value: "em_transito", label: "Em trânsito" },
  { value: "parada", label: "Parada" },
  { value: "em_descarga", label: "Em descarga" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "com_ocorrencia", label: "Com ocorrência" },
];

export interface Viagem {
  id: UUID;
  transportadora_id: UUID;
  numero_viagem: number;
  motorista_id?: UUID;
  veiculo_principal_id?: UUID;
  veiculo_reboque_id?: UUID;
  cliente_origem_id?: UUID;
  cliente_destino_id?: UUID;
  produto_carga_id?: UUID;
  quantidade?: number;
  unidade_medida?: UnidadeMedida;
  peso_bruto?: number;
  peso_liquido?: number;
  valor_frete?: number;
  forma_pagamento?: string;
  status: StatusViagem;
  data_criacao: ISODate;
  data_prevista_saida?: ISODate;
  data_real_saida?: ISODate;
  data_prevista_chegada?: ISODate;
  data_real_chegada?: ISODate;
  /** Auditoria de finalização (operador web ou motorista PWA). */
  finalizacao_origem?: "motorista" | "operador";
  finalizacao_em?: ISODate;
  finalizacao_por_nome?: string;
  finalizacao_motivo?: string;
  endereco_origem: Endereco;
  endereco_destino: Endereco;
  observacoes_operacionais?: string;
  observacoes_internas?: string;
  documentos: DocumentoAnexo[];
  created_at: ISODate;
  updated_at: ISODate;
}

// ── Operação da viagem: eventos, ocorrências, localização ───────────────────

export type OrigemRegistroViagem = "sistema" | "motorista" | "operador";

export type TipoViagemEvento =
  | "viagem_criada"
  | "status_alterado"
  | "saida_origem"
  | "chegada_destino"
  | "parada"
  | "retomada"
  | "carregamento_inicio"
  | "carregamento_fim"
  | "descarga_inicio"
  | "descarga_fim"
  | "documento_anexado"
  | "ocorrencia_registrada"
  | "localizacao_enviada"
  | "observacao"
  | "viagem_finalizada";

export const TIPOS_VIAGEM_EVENTO: { value: TipoViagemEvento; label: string }[] = [
  { value: "viagem_criada", label: "Viagem criada" },
  { value: "status_alterado", label: "Status alterado" },
  { value: "saida_origem", label: "Saída da origem" },
  { value: "chegada_destino", label: "Chegada ao destino" },
  { value: "parada", label: "Parada" },
  { value: "retomada", label: "Retomada" },
  { value: "carregamento_inicio", label: "Início do carregamento" },
  { value: "carregamento_fim", label: "Fim do carregamento" },
  { value: "descarga_inicio", label: "Início da descarga" },
  { value: "descarga_fim", label: "Fim da descarga" },
  { value: "documento_anexado", label: "Documento anexado" },
  { value: "ocorrencia_registrada", label: "Ocorrência registrada" },
  { value: "localizacao_enviada", label: "Localização enviada" },
  { value: "observacao", label: "Observação" },
  { value: "viagem_finalizada", label: "Viagem finalizada" },
];

export interface ViagemEvento {
  id: UUID;
  transportadora_id: UUID;
  viagem_id: UUID;
  tipo: TipoViagemEvento;
  titulo: string;
  descricao?: string;
  status_anterior?: StatusViagem;
  status_novo?: StatusViagem;
  origem: OrigemRegistroViagem;
  motorista_id?: UUID;
  created_at: ISODate;
}

export type TipoViagemOcorrencia =
  | "mecanica"
  | "acidente"
  | "atraso"
  | "documentacao"
  | "carga"
  | "climatica"
  | "seguranca"
  | "outro";

export type GravidadeOcorrencia = "baixa" | "media" | "alta" | "critica";
export type StatusOcorrencia = "aberta" | "em_tratamento" | "resolvida";

export const TIPOS_VIAGEM_OCORRENCIA: { value: TipoViagemOcorrencia; label: string }[] = [
  { value: "mecanica", label: "Mecânica" },
  { value: "acidente", label: "Acidente" },
  { value: "atraso", label: "Atraso" },
  { value: "documentacao", label: "Documentação" },
  { value: "carga", label: "Carga" },
  { value: "climatica", label: "Climática" },
  { value: "seguranca", label: "Segurança" },
  { value: "outro", label: "Outro" },
];

export const GRAVIDADE_OCORRENCIA: { value: GravidadeOcorrencia; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export const STATUS_OCORRENCIA: { value: StatusOcorrencia; label: string }[] = [
  { value: "aberta", label: "Aberta" },
  { value: "em_tratamento", label: "Em tratamento" },
  { value: "resolvida", label: "Resolvida" },
];

export interface ViagemOcorrencia {
  id: UUID;
  transportadora_id: UUID;
  viagem_id: UUID;
  tipo: TipoViagemOcorrencia;
  gravidade: GravidadeOcorrencia;
  status: StatusOcorrencia;
  titulo: string;
  descricao: string;
  latitude?: number;
  longitude?: number;
  motorista_id?: UUID;
  created_at: ISODate;
  updated_at: ISODate;
  resolvida_em?: ISODate;
}

export interface ViagemLocalizacao {
  id: UUID;
  transportadora_id: UUID;
  viagem_id: UUID;
  motorista_id?: UUID;
  latitude: number;
  longitude: number;
  velocidade_kmh?: number;
  precisao_metros?: number;
  heading?: number;
  registrado_em: ISODate;
  created_at: ISODate;
}

// ── Fase 2: Pneus + Financeiro ───────────────────────────────────────────────

export type TipoFornecedor = "PF" | "PJ";

export interface Fornecedor {
  id: UUID;
  transportadora_id: UUID;
  tipo: TipoFornecedor;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  cpf?: string;
  inscricao_estadual?: string;
  telefone_principal?: string;
  telefone_secundario?: string;
  email?: string;
  contato_responsavel?: string;
  endereco: Endereco;
  observacoes?: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export type StatusPneu = "estoque" | "instalado" | "recapagem" | "descartado";

export const MEDIDAS_PNEU = [
  "275/80R22.5",
  "295/80R22.5",
  "315/80R22.5",
  "11R22.5",
  "12R22.5",
  "385/65R22.5",
  "215/75R17.5",
  "235/75R17.5",
  "Outra",
] as const;

export type PosicaoPneu =
  | "dianteiro_esq"
  | "dianteiro_dir"
  | "dianteiro2_esq"
  | "dianteiro2_dir"
  | "eixo2_esq_externo"
  | "eixo2_esq_interno"
  | "eixo2_dir_interno"
  | "eixo2_dir_externo"
  | "eixo3_esq_externo"
  | "eixo3_esq_interno"
  | "eixo3_dir_interno"
  | "eixo3_dir_externo"
  | "eixo4_esq_externo"
  | "eixo4_esq_interno"
  | "eixo4_dir_interno"
  | "eixo4_dir_externo"
  | "estepe";

export const POSICOES_PNEU: { value: PosicaoPneu; label: string; eixo: number }[] = [
  { value: "dianteiro_esq", label: "Dianteiro E", eixo: 1 },
  { value: "dianteiro_dir", label: "Dianteiro D", eixo: 1 },
  { value: "dianteiro2_esq", label: "Dianteiro 2 E", eixo: 2 },
  { value: "dianteiro2_dir", label: "Dianteiro 2 D", eixo: 2 },
  { value: "eixo2_esq_externo", label: "Eixo 2 EE", eixo: 2 },
  { value: "eixo2_esq_interno", label: "Eixo 2 EI", eixo: 2 },
  { value: "eixo2_dir_interno", label: "Eixo 2 DI", eixo: 2 },
  { value: "eixo2_dir_externo", label: "Eixo 2 DE", eixo: 2 },
  { value: "eixo3_esq_externo", label: "Eixo 3 EE", eixo: 3 },
  { value: "eixo3_esq_interno", label: "Eixo 3 EI", eixo: 3 },
  { value: "eixo3_dir_interno", label: "Eixo 3 DI", eixo: 3 },
  { value: "eixo3_dir_externo", label: "Eixo 3 DE", eixo: 3 },
  { value: "eixo4_esq_externo", label: "Eixo 4 EE", eixo: 4 },
  { value: "eixo4_esq_interno", label: "Eixo 4 EI", eixo: 4 },
  { value: "eixo4_dir_interno", label: "Eixo 4 DI", eixo: 4 },
  { value: "eixo4_dir_externo", label: "Eixo 4 DE", eixo: 4 },
  { value: "estepe", label: "Estepe", eixo: 0 },
];

export interface Pneu {
  id: UUID;
  transportadora_id: UUID;
  codigo_fogo: string;
  marca: string;
  modelo?: string;
  medida: string;
  dot?: string;
  numero_serie?: string;
  fornecedor_id?: UUID;
  valor_compra?: number;
  data_compra?: ISODate;
  sulco_inicial_mm?: number;
  sulco_atual_mm?: number;
  hodometro_instalacao?: number;
  status: StatusPneu;
  veiculo_id?: UUID;
  posicao?: PosicaoPneu;
  observacoes?: string;
  created_at: ISODate;
  updated_at: ISODate;
}

export type TipoLancamento = "receita" | "despesa";

export const CATEGORIAS_FINANCEIRAS = [
  { value: "frete", label: "Frete", tipo: "receita" as const },
  { value: "adiantamento", label: "Adiantamento", tipo: "receita" as const },
  { value: "combustivel", label: "Combustível", tipo: "despesa" as const },
  { value: "manutencao", label: "Manutenção", tipo: "despesa" as const },
  { value: "pneus", label: "Pneus", tipo: "despesa" as const },
  { value: "pedagio", label: "Pedágio", tipo: "despesa" as const },
  { value: "salario", label: "Salário / Pró-labore", tipo: "despesa" as const },
  { value: "impostos", label: "Impostos", tipo: "despesa" as const },
  { value: "seguro", label: "Seguro", tipo: "despesa" as const },
  { value: "outros", label: "Outros", tipo: "despesa" as const },
] as const;

export type CategoriaFinanceira = (typeof CATEGORIAS_FINANCEIRAS)[number]["value"];

export type StatusLancamento = "pendente" | "pago" | "cancelado";

export interface LancamentoFinanceiro {
  id: UUID;
  transportadora_id: UUID;
  tipo: TipoLancamento;
  categoria: CategoriaFinanceira;
  descricao: string;
  valor: number;
  data_lancamento: ISODate;
  data_vencimento?: ISODate;
  data_pagamento?: ISODate;
  status: StatusLancamento;
  viagem_id?: UUID;
  veiculo_id?: UUID;
  fornecedor_id?: UUID;
  forma_pagamento?: string;
  observacoes?: string;
  created_at: ISODate;
  updated_at: ISODate;
}
