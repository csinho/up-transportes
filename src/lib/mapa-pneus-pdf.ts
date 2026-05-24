/**
 * Gera o bloco "Mapa de posições (vista superior)" no PDF
 * com a mesma estrutura visual de TireLayout (instalação manual).
 */
import type { Content } from "pdfmake/interfaces";
import type { Pneu, PosicaoPneu } from "@/types";
import { POSICOES_PNEU } from "@/types";
import type { CorpoVariant, FaixaLayout } from "@/lib/veiculo-pneus-perfil";

function labelPos(pos: PosicaoPneu): string {
  return POSICOES_PNEU.find((p) => p.value === pos)?.label ?? pos;
}

function tireSlotContent(pneu: Pneu | undefined, posicao: PosicaoPneu): Content {
  const instalado = !!pneu;
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { text: labelPos(posicao), fontSize: 7, color: "#64748b", alignment: "center" },
              {
                text: instalado ? "●" : "○",
                fontSize: 22,
                alignment: "center",
                color: instalado ? "#059669" : "#cbd5e1",
                margin: [0, 2, 0, 2],
              },
              {
                text: pneu?.codigo_fogo ?? "—",
                fontSize: 8,
                bold: instalado,
                alignment: "center",
              },
              ...(pneu?.sulco_atual_mm != null
                ? [
                    {
                      text: `${pneu.sulco_atual_mm} mm`,
                      fontSize: 7,
                      color: "#64748b",
                      alignment: "center" as const,
                    },
                  ]
                : []),
            ],
            margin: [4, 6, 4, 6],
            fillColor: instalado ? "#ecfdf5" : "#f8fafc",
          },
        ],
      ],
    },
    layout: {
      hLineColor: () => (instalado ? "#86efac" : "#cbd5e1"),
      vLineColor: () => (instalado ? "#86efac" : "#cbd5e1"),
      hLineWidth: () => 1,
      vLineWidth: () => 1,
    },
  };
}

function corpoFill(variant: CorpoVariant): string {
  const map: Record<CorpoVariant, string> = {
    cabine: "#e2e8f0",
    carroceria: "#f1f5f9",
    engate: "#fef9c3",
    pescoco: "#f1f5f9",
    quinta_roda: "#e2e8f0",
  };
  return map[variant];
}

function corpoMargin(altura?: "sm" | "md" | "lg"): [number, number, number, number] {
  const v = { sm: 10, md: 16, lg: 24 }[altura ?? "md"];
  return [0, v, 0, v];
}

function faixaEixoPdf(
  faixa: Extract<FaixaLayout, { tipo: "eixo" }>,
  porPosicao: Partial<Record<PosicaoPneu, Pneu>>,
): Content {
  const titulo: Content = {
    text: faixa.titulo,
    fontSize: 8,
    color: "#64748b",
    alignment: "center",
    bold: true,
    margin: [0, 0, 0, 4],
  };

  if (faixa.dual) {
    const [ee, ei, di, de] = faixa.posicoes;
    return {
      stack: [
        titulo,
        {
          columns: [
            {
              width: "*",
              columns: [
                { width: "*", ...tireSlotContent(porPosicao[ee], ee) },
                { width: "*", ...tireSlotContent(porPosicao[ei], ei) },
              ],
              columnGap: 4,
            },
            { width: 28, text: "" },
            {
              width: "*",
              columns: [
                { width: "*", ...tireSlotContent(porPosicao[di], di) },
                { width: "*", ...tireSlotContent(porPosicao[de], de) },
              ],
              columnGap: 4,
            },
          ],
        },
      ],
      margin: [0, 2, 0, 6],
    };
  }

  return {
    stack: [
      titulo,
      {
        columns: faixa.posicoes.map((pos) => ({
          width: "auto",
          ...tireSlotContent(porPosicao[pos], pos),
        })),
        columnGap: 16,
        alignment: "center",
      },
    ],
    margin: [0, 2, 0, 6],
  };
}

function faixaCorpoPdf(faixa: Extract<FaixaLayout, { tipo: "corpo" }>): Content {
  return {
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: faixa.rotulo,
            fontSize: 9,
            color: "#64748b",
            alignment: "center",
            fillColor: corpoFill(faixa.variant),
            margin: corpoMargin(faixa.altura),
          },
        ],
      ],
    },
    layout: {
      hLineColor: faixa.variant === "engate" || faixa.variant === "quinta_roda" ? "#fbbf24" : "#e2e8f0",
      vLineColor: faixa.variant === "engate" || faixa.variant === "quinta_roda" ? "#fbbf24" : "#e2e8f0",
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      paddingLeft: () => 16,
      paddingRight: () => 16,
    },
    margin: [16, 4, 16, 4],
  };
}

function faixaEspacadorPdf(faixa: Extract<FaixaLayout, { tipo: "espacador" }>): Content {
  return {
    columns: [
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 6,
            x2: 200,
            y2: 6,
            lineWidth: 0.5,
            lineColor: "#cbd5e1",
            dash: { length: 4, space: 3 },
          },
        ],
        width: "*",
      },
      {
        width: "auto",
        text: faixa.rotulo,
        fontSize: 8,
        color: "#64748b",
        margin: [8, 0, 8, 0],
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 6,
            x2: 200,
            y2: 6,
            lineWidth: 0.5,
            lineColor: "#cbd5e1",
            dash: { length: 4, space: 3 },
          },
        ],
        width: "*",
      },
    ],
    margin: [32, 6, 32, 6],
  };
}

function faixaEstepePdf(
  faixa: Extract<FaixaLayout, { tipo: "estepe" }>,
  porPosicao: Partial<Record<PosicaoPneu, Pneu>>,
): Content {
  const slot = tireSlotContent(porPosicao.estepe, "estepe");
  const alinh = faixa.alinhamento ?? "centro";

  if (alinh === "esquerda") {
    return { columns: [{ width: "auto", ...slot }, { width: "*", text: "" }], margin: [16, 4, 0, 4] };
  }
  if (alinh === "direita") {
    return { columns: [{ width: "*", text: "" }, { width: "auto", ...slot }], margin: [0, 4, 16, 4] };
  }
  return { columns: [{ width: "*", text: "" }, { width: "auto", ...slot }, { width: "*", text: "" }], margin: [0, 4, 0, 4] };
}

/** Monta o mapa visual idêntico em estrutura ao TireLayout. */
export function buildMapaVistaSuperiorPdf(
  faixas: FaixaLayout[],
  porPosicao: Partial<Record<PosicaoPneu, Pneu>>,
): Content[] {
  const blocos: Content[] = [
    {
      canvas: [
        {
          type: "line",
          x1: 40,
          y1: 0,
          x2: 491,
          y2: 0,
          lineWidth: 3,
          lineColor: "#cbd5e1",
          lineCap: "round",
        },
      ],
      margin: [0, 0, 0, 8],
    },
  ];

  for (const faixa of faixas) {
    if (faixa.tipo === "eixo") blocos.push(faixaEixoPdf(faixa, porPosicao));
    else if (faixa.tipo === "corpo") blocos.push(faixaCorpoPdf(faixa));
    else if (faixa.tipo === "espacador") blocos.push(faixaEspacadorPdf(faixa));
    else if (faixa.tipo === "estepe") blocos.push(faixaEstepePdf(faixa, porPosicao));
  }

  blocos.push({
    canvas: [
      {
        type: "line",
        x1: 40,
        y1: 0,
        x2: 491,
        y2: 0,
        lineWidth: 3,
        lineColor: "#cbd5e1",
        lineCap: "round",
      },
    ],
    margin: [0, 8, 0, 0],
  });

  return blocos;
}
