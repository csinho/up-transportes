import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import type { Transportadora, Viagem, ViagemEvento, ViagemOcorrencia } from "@/types";
import {
  GRAVIDADE_OCORRENCIA,
  STATUS_OCORRENCIA,
  STATUS_VIAGEM,
  TIPOS_VIAGEM_EVENTO,
  TIPOS_VIAGEM_OCORRENCIA,
} from "@/types";

type VfsExport = {
  vfs?: Record<string, string>;
  pdfMake?: { vfs: Record<string, string> };
};
const vfsExport = pdfFonts as unknown as VfsExport;
const vfs = vfsExport.vfs ?? vfsExport.pdfMake?.vfs;
if (vfs) {
  (pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs;
}

const ORIGEM_LABEL: Record<string, string> = {
  sistema: "Sistema",
  motorista: "Motorista",
  operador: "Operador",
};

function fmtData(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function viagemNumero(viagens: Viagem[], viagemId: string) {
  const v = viagens.find((x) => x.id === viagemId);
  return v ? `#${String(v.numero_viagem).padStart(5, "0")}` : "—";
}

function slugTransportadora(transportadora?: Transportadora) {
  return transportadora?.nome_fantasia?.replace(/\s+/g, "-").toLowerCase() ?? "auditoria";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function cabecalhoCsv(titulo: string, transportadora?: Transportadora, filtrado?: boolean) {
  const linhas = [
    titulo,
    `Transportadora;${transportadora?.nome_fantasia ?? "—"}`,
    `Gerado em;${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
  ];
  if (filtrado) linhas.push("Filtros;Sim — exportação reflete busca/filtros ativos na tela");
  linhas.push("");
  return linhas;
}

function exportCsv(
  filename: string,
  headerRow: string[],
  rows: string[][],
  meta: { titulo: string; transportadora?: Transportadora; filtrado?: boolean },
) {
  const sep = ";";
  const linhas = [
    ...cabecalhoCsv(meta.titulo, meta.transportadora, meta.filtrado),
    headerRow.join(sep),
    ...rows.map((row) => row.map(csvEscape).join(sep)),
  ];
  const bom = "\uFEFF";
  downloadBlob(
    new Blob([bom + linhas.join("\n")], { type: "text/csv;charset=utf-8" }),
    filename,
  );
}

type ExportMeta = {
  transportadora?: Transportadora;
  filtrado?: boolean;
};

export function exportEventosCsv(
  eventos: ViagemEvento[],
  viagens: Viagem[],
  meta: ExportMeta,
) {
  const slug = slugTransportadora(meta.transportadora);
  const rows = eventos.map((ev) => [
    fmtData(ev.created_at),
    viagemNumero(viagens, ev.viagem_id),
    ev.titulo,
    TIPOS_VIAGEM_EVENTO.find((t) => t.value === ev.tipo)?.label ?? ev.tipo,
    ORIGEM_LABEL[ev.origem] ?? ev.origem,
    ev.status_novo
      ? `${STATUS_VIAGEM.find((s) => s.value === ev.status_anterior)?.label ?? ""} → ${STATUS_VIAGEM.find((s) => s.value === ev.status_novo)?.label ?? ev.status_novo}`
      : "",
    ev.descricao ?? "",
  ]);
  exportCsv(
    `eventos-${slug}-${format(new Date(), "yyyy-MM-dd")}.csv`,
    ["Data/hora", "Viagem", "Evento", "Tipo", "Origem", "Status", "Descrição"],
    rows,
    { titulo: "Eventos da operação", ...meta },
  );
}

export function exportEventosPdf(
  eventos: ViagemEvento[],
  viagens: Viagem[],
  meta: ExportMeta,
) {
  const slug = slugTransportadora(meta.transportadora);
  const body = eventos.map((ev) => [
    fmtData(ev.created_at),
    viagemNumero(viagens, ev.viagem_id),
    ev.titulo,
    TIPOS_VIAGEM_EVENTO.find((t) => t.value === ev.tipo)?.label ?? ev.tipo,
    ORIGEM_LABEL[ev.origem] ?? ev.origem,
    ev.descricao ?? "—",
  ]);

  const content: Content[] = [
    { text: "Eventos da operação", style: "header" },
    { text: meta.transportadora?.nome_fantasia ?? "Transportadora", style: "subheader" },
    {
      text: `Gerado em ${fmtData(new Date().toISOString())}${meta.filtrado ? " · com filtros aplicados" : ""}`,
      style: "muted",
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: [70, 45, "*", 70, 55, "*"],
        body: [["Data/hora", "Viagem", "Evento", "Tipo", "Origem", "Descrição"], ...body],
      },
      layout: "lightHorizontalLines",
      fontSize: 8,
    },
  ];

  const doc: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 48],
    content,
    styles: {
      header: { fontSize: 16, bold: true },
      subheader: { fontSize: 11, color: "#444", margin: [0, 4, 0, 0] },
      muted: { fontSize: 9, color: "#666" },
    },
    defaultStyle: { font: "Roboto" },
  };

  pdfMake.createPdf(doc).download(`eventos-${slug}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function exportOcorrenciasCsv(
  ocorrencias: ViagemOcorrencia[],
  viagens: Viagem[],
  meta: ExportMeta,
) {
  const slug = slugTransportadora(meta.transportadora);
  const rows = ocorrencias.map((oc) => [
    fmtData(oc.created_at),
    viagemNumero(viagens, oc.viagem_id),
    oc.titulo,
    TIPOS_VIAGEM_OCORRENCIA.find((t) => t.value === oc.tipo)?.label ?? oc.tipo,
    GRAVIDADE_OCORRENCIA.find((g) => g.value === oc.gravidade)?.label ?? oc.gravidade,
    STATUS_OCORRENCIA.find((s) => s.value === oc.status)?.label ?? oc.status,
    oc.descricao ?? "",
  ]);
  exportCsv(
    `ocorrencias-${slug}-${format(new Date(), "yyyy-MM-dd")}.csv`,
    ["Data/hora", "Viagem", "Título", "Tipo", "Gravidade", "Status", "Descrição"],
    rows,
    { titulo: "Ocorrências registradas", ...meta },
  );
}

export function exportOcorrenciasPdf(
  ocorrencias: ViagemOcorrencia[],
  viagens: Viagem[],
  meta: ExportMeta,
) {
  const slug = slugTransportadora(meta.transportadora);
  const body = ocorrencias.map((oc) => [
    fmtData(oc.created_at),
    viagemNumero(viagens, oc.viagem_id),
    oc.titulo,
    TIPOS_VIAGEM_OCORRENCIA.find((t) => t.value === oc.tipo)?.label ?? oc.tipo,
    GRAVIDADE_OCORRENCIA.find((g) => g.value === oc.gravidade)?.label ?? oc.gravidade,
    STATUS_OCORRENCIA.find((s) => s.value === oc.status)?.label ?? oc.status,
  ]);

  const content: Content[] = [
    { text: "Ocorrências registradas", style: "header" },
    { text: meta.transportadora?.nome_fantasia ?? "Transportadora", style: "subheader" },
    {
      text: `Gerado em ${fmtData(new Date().toISOString())}${meta.filtrado ? " · com filtros aplicados" : ""}`,
      style: "muted",
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        headerRows: 1,
        widths: [70, 45, "*", 65, 55, 55],
        body: [
          ["Data/hora", "Viagem", "Título", "Tipo", "Gravidade", "Status"],
          ...body,
        ],
      },
      layout: "lightHorizontalLines",
      fontSize: 8,
    },
  ];

  const doc: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 48],
    content,
    styles: {
      header: { fontSize: 16, bold: true },
      subheader: { fontSize: 11, color: "#444", margin: [0, 4, 0, 0] },
      muted: { fontSize: 9, color: "#666" },
    },
    defaultStyle: { font: "Roboto" },
  };

  pdfMake.createPdf(doc).download(`ocorrencias-${slug}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
