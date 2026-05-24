/**
 * Geração de PDF da viagem com pdfmake.
 *
 * pdfmake usa vfs_fonts para embutir as fontes Roboto. Importamos via
 * subpath para evitar SSR; este módulo só deve ser carregado no browser.
 */
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type {
  TDocumentDefinitions,
  Content,
  TableCell,
  StyleDictionary,
} from "pdfmake/interfaces";
import type {
  Viagem,
  Transportadora,
  Motorista,
  Veiculo,
  Cliente,
  ProdutoCarga,
} from "@/types";
import { STATUS_VIAGEM } from "@/types";
import { formatPlaca } from "./masks";

// vfs_fonts pode exportar como default OU como { pdfMake: { vfs } } dependendo da versão.
type VfsExport = {
  vfs?: Record<string, string>;
  pdfMake?: { vfs: Record<string, string> };
};
const vfsExport = pdfFonts as unknown as VfsExport;
const vfs = vfsExport.vfs ?? vfsExport.pdfMake?.vfs;
if (vfs) {
  (pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs;
}

const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");
const fmtMoney = (n?: number) =>
  n == null
    ? "—"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const labelStatus = (s: string) => STATUS_VIAGEM.find((x) => x.value === s)?.label ?? s;

interface Args {
  viagem: Viagem;
  transportadora: Transportadora;
  motorista?: Motorista;
  veiculoPrincipal?: Veiculo;
  veiculoReboque?: Veiculo;
  clienteOrigem?: Cliente;
  clienteDestino?: Cliente;
  produto?: ProdutoCarga;
}

function enderecoLinha(e: { logradouro?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; cep?: string }) {
  const linha1 = [e.logradouro, e.numero].filter(Boolean).join(", ") + (e.complemento ? ` — ${e.complemento}` : "");
  const linha2 = [e.bairro, [e.cidade, e.uf].filter(Boolean).join("/"), e.cep].filter(Boolean).join(" · ");
  return [linha1, linha2].filter(Boolean).join("\n");
}

function kv(rows: [string, string | number | undefined][]): Content {
  const body: TableCell[][] = rows.map(([k, v]) => [
    { text: k, style: "k" },
    { text: v == null || v === "" ? "—" : String(v), style: "v" },
  ]);
  return {
    table: { widths: [120, "*"], body },
    layout: "noBorders",
    margin: [0, 2, 0, 2],
  };
}

function sectionTitle(text: string): Content {
  return {
    text,
    style: "section",
    margin: [0, 12, 0, 6],
  };
}

export async function gerarPdfViagem(args: Args) {
  const { viagem, transportadora, motorista, veiculoPrincipal, veiculoReboque, clienteOrigem, clienteDestino, produto } = args;

  const cabecalho: Content = {
    columns: [
      {
        width: 60,
        text: transportadora.nome_fantasia?.[0]?.toUpperCase() ?? "T",
        alignment: "center",
        fontSize: 28,
        bold: true,
        color: "#1e293b",
        margin: [0, 6, 0, 0],
      },
      {
        width: "*",
        stack: [
          { text: transportadora.nome_fantasia, style: "h1" },
          { text: transportadora.razao_social, style: "muted" },
          {
            text: [
              transportadora.cnpj ? `CNPJ: ${transportadora.cnpj}  ` : "",
              transportadora.cpf ? `CPF: ${transportadora.cpf}  ` : "",
              transportadora.rntrc ? `RNTRC: ${transportadora.rntrc}` : "",
            ].join(""),
            style: "muted",
          },
          {
            text: [
              enderecoLinha(transportadora.endereco),
            ].join(" · "),
            style: "muted",
          },
          {
            text: [
              transportadora.telefone_principal ? `Tel: ${transportadora.telefone_principal}` : "",
              transportadora.whatsapp ? `WhatsApp: ${transportadora.whatsapp}` : "",
              transportadora.email ? transportadora.email : "",
            ].filter(Boolean).join("  ·  "),
            style: "muted",
          },
        ],
      },
      {
        width: 160,
        stack: [
          { text: "Ordem de Viagem", alignment: "right", bold: true },
          { text: `Nº ${String(viagem.numero_viagem).padStart(5, "0")}`, alignment: "right", fontSize: 14, bold: true, color: "#0f172a" },
          { text: `Status: ${labelStatus(viagem.status)}`, alignment: "right", style: "muted" },
          { text: `Emitido em ${new Date().toLocaleString("pt-BR")}`, alignment: "right", style: "muted" },
        ],
      },
    ],
  };

  const blocoOrigemDestino: Content = {
    columns: [
      {
        width: "*",
        stack: [
          { text: "ORIGEM (A)", style: "tag" },
          { text: clienteOrigem?.nome ?? "—", bold: true, margin: [0, 2, 0, 2] },
          { text: clienteOrigem?.cnpj || clienteOrigem?.cpf || "", style: "muted" },
          { text: enderecoLinha(viagem.endereco_origem), style: "small" },
        ],
      },
      { width: 30, text: "→", alignment: "center", fontSize: 22, margin: [0, 16, 0, 0], color: "#64748b" },
      {
        width: "*",
        stack: [
          { text: "DESTINO (B)", style: "tag" },
          { text: clienteDestino?.nome ?? "—", bold: true, margin: [0, 2, 0, 2] },
          { text: clienteDestino?.cnpj || clienteDestino?.cpf || "", style: "muted" },
          { text: enderecoLinha(viagem.endereco_destino), style: "small" },
        ],
      },
    ],
    margin: [0, 8, 0, 0],
  };

  const docsBody: TableCell[][] = [
    [
      { text: "Tipo", style: "th" },
      { text: "Número", style: "th" },
      { text: "Série", style: "th" },
      { text: "Emissão", style: "th" },
      { text: "Chave", style: "th" },
    ],
    ...(viagem.documentos.length
      ? viagem.documentos.map((d) => [
          d.tipo_documento,
          d.numero_documento ?? "—",
          d.serie ?? "—",
          fmtDate(d.data_emissao),
          { text: d.chave_acesso ?? "—", fontSize: 7 },
        ])
      : [[{ text: "Nenhum documento vinculado.", colSpan: 5, italics: true, color: "#94a3b8" }, {}, {}, {}, {}]]),
  ];

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [32, 32, 32, 60],
    info: {
      title: `Viagem ${viagem.numero_viagem} - ${transportadora.nome_fantasia}`,
      author: transportadora.nome_fantasia,
    },
    content: [
      cabecalho,
      { canvas: [{ type: "line", x1: 0, y1: 8, x2: 531, y2: 8, lineWidth: 1, lineColor: "#cbd5e1" }] },

      sectionTitle("Identificação da viagem"),
      kv([
        ["Número", String(viagem.numero_viagem).padStart(5, "0")],
        ["Status", labelStatus(viagem.status)],
        ["Criada em", fmtDate(viagem.data_criacao)],
        ["Saída prevista", fmtDate(viagem.data_prevista_saida)],
        ["Chegada prevista", fmtDate(viagem.data_prevista_chegada)],
        ["Saída real", fmtDate(viagem.data_real_saida)],
        ["Chegada real", fmtDate(viagem.data_real_chegada)],
      ]),

      sectionTitle("Trajeto"),
      blocoOrigemDestino,

      sectionTitle("Motorista"),
      kv([
        ["Nome", motorista?.nome],
        ["CPF", motorista?.cpf],
        ["Telefone", motorista?.telefone_principal],
        ["WhatsApp", motorista?.whatsapp],
        ["CNH", motorista ? `${motorista.cnh.numero} — Cat. ${motorista.cnh.categoria}` : undefined],
        ["Validade CNH", fmtDate(motorista?.cnh.data_validade)],
      ]),

      sectionTitle("Veículos"),
      kv([
        ["Tipo (principal)", veiculoPrincipal?.tipo_veiculo],
        ["Placa", veiculoPrincipal ? formatPlaca(veiculoPrincipal.placa) : undefined],
        ["Marca/Modelo", veiculoPrincipal ? `${veiculoPrincipal.marca ?? ""} ${veiculoPrincipal.modelo ?? ""}`.trim() : undefined],
        ["RENAVAM", veiculoPrincipal?.renavam],
        ["Chassi", veiculoPrincipal?.chassi],
        ["RNTRC", veiculoPrincipal?.rntrc],
        ...(veiculoReboque
          ? ([
              ["Reboque", veiculoReboque.tipo_veiculo],
              ["Placa reboque", formatPlaca(veiculoReboque.placa)],
              ["RENAVAM reboque", veiculoReboque.renavam],
              ["Chassi reboque", veiculoReboque.chassi],
            ] as [string, string | undefined][])
          : []),
      ]),

      sectionTitle("Carga transportada"),
      kv([
        ["Produto", produto?.nome],
        ["Categoria", produto?.categoria],
        ["Quantidade", viagem.quantidade != null ? `${viagem.quantidade} ${viagem.unidade_medida ?? produto?.unidade_medida ?? ""}` : undefined],
        ["Peso bruto", viagem.peso_bruto != null ? `${viagem.peso_bruto} kg` : undefined],
        ["Peso líquido", viagem.peso_liquido != null ? `${viagem.peso_liquido} kg` : undefined],
        ["Produto perigoso", produto?.produto_perigoso ? `Sim (ONU ${produto.codigo_onu ?? "—"}, classe ${produto.classe_risco ?? "—"})` : "Não"],
        ["Valor do frete", fmtMoney(viagem.valor_frete)],
        ["Forma de pagamento", viagem.forma_pagamento],
      ]),

      sectionTitle("Documentos vinculados"),
      {
        table: { widths: ["*", 60, 40, 60, "*"], body: docsBody },
        layout: {
          fillColor: (row) => (row === 0 ? "#f1f5f9" : null),
          hLineColor: "#e2e8f0",
          vLineColor: "#e2e8f0",
        },
      },

      sectionTitle("Observações"),
      { text: viagem.observacoes_operacionais || "—", style: "small" },

      // Assinaturas
      {
        margin: [0, 30, 0, 0],
        columns: [
          { stack: [{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5 }] }, { text: "Motorista", style: "small", alignment: "center", margin: [0, 4, 0, 0] }] },
          { stack: [{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5 }] }, { text: "Transportadora", style: "small", alignment: "center", margin: [0, 4, 0, 0] }] },
          { stack: [{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5 }] }, { text: "Cliente", style: "small", alignment: "center", margin: [0, 4, 0, 0] }] },
        ],
        columnGap: 10,
      },
    ],
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `${transportadora.nome_fantasia}`, style: "small", alignment: "left", margin: [32, 20, 0, 0] },
        { text: `Página ${currentPage} de ${pageCount}`, style: "small", alignment: "right", margin: [0, 20, 32, 0] },
      ],
    }),
    styles: {
      h1: { fontSize: 16, bold: true, color: "#0f172a" },
      section: { fontSize: 11, bold: true, color: "#0f172a", decoration: "underline", decorationColor: "#cbd5e1" },
      tag: { fontSize: 8, bold: true, color: "#64748b" },
      muted: { fontSize: 8, color: "#64748b" },
      small: { fontSize: 8, color: "#334155" },
      k: { fontSize: 9, color: "#64748b", margin: [0, 1, 0, 1] },
      v: { fontSize: 9, color: "#0f172a", margin: [0, 1, 0, 1] },
      th: { fontSize: 9, bold: true, color: "#0f172a" },
    } as StyleDictionary,
    defaultStyle: { font: "Roboto", fontSize: 10 },
  };

  pdfMake.createPdf(docDefinition).download(`viagem-${String(viagem.numero_viagem).padStart(5, "0")}.pdf`);
}
