import { useState } from "react";
import type { Pneu, PosicaoPneu, Veiculo } from "@/types";
import { POSICOES_PNEU } from "@/types";
import { layoutVisualVeiculo, pneusPorPosicao } from "@/lib/pneus-layout";
import type { CorpoVariant, FaixaLayout } from "@/lib/veiculo-pneus-perfil";
import { cn } from "@/lib/utils";
import { Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  veiculo: Veiculo;
  pneusInstalados: Pneu[];
  pneusEstoque: Pneu[];
  onInstalar: (pneuId: string, posicao: PosicaoPneu) => void;
  onDesinstalar: (pneuId: string) => void;
};

function TireSlot({
  posicao,
  pneu,
  onDrop,
  onRemove,
}: {
  posicao: PosicaoPneu;
  pneu?: Pneu;
  onDrop: (pneuId: string) => void;
  onRemove: () => void;
}) {
  const [over, setOver] = useState(false);
  const label = POSICOES_PNEU.find((p) => p.value === posicao)?.label ?? posicao;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-lg border-2 border-dashed p-2 min-w-[68px] transition-colors",
        over && "border-primary bg-primary/5",
        pneu
          ? "border-solid border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20"
          : "border-muted-foreground/30",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/pneu-id");
        if (id) onDrop(id);
      }}
    >
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
      {pneu ? (
        <div className="relative group">
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/pneu-id", pneu.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            className="flex flex-col items-center cursor-grab active:cursor-grabbing"
            title={`${pneu.codigo_fogo} — ${pneu.marca} ${pneu.medida}`}
          >
            <Circle className="h-9 w-9 text-emerald-600 fill-emerald-100 stroke-[1.5]" />
            <span className="text-[10px] font-medium mt-0.5 max-w-[64px] truncate">{pneu.codigo_fogo}</span>
            {pneu.sulco_atual_mm != null && (
              <span className="text-[9px] text-muted-foreground">{pneu.sulco_atual_mm} mm</span>
            )}
          </div>
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Circle className="h-9 w-9 text-muted-foreground/25 stroke-[1.5]" />
      )}
    </div>
  );
}

function corpoClasses(variant: CorpoVariant, altura: "sm" | "md" | "lg" = "md") {
  const h = { sm: "h-10", md: "h-16", lg: "h-24" }[altura];
  const styles: Record<CorpoVariant, string> = {
    cabine: "bg-slate-200/60 dark:bg-slate-800/40 border-slate-300/50",
    carroceria: "bg-muted-foreground/10 border-muted-foreground/20",
    engate: "bg-amber-100/50 dark:bg-amber-950/30 border-amber-400/40 border-dashed",
    pescoco: "bg-muted-foreground/10 border-muted-foreground/20 rounded-t-lg",
    quinta_roda: "bg-slate-300/40 dark:bg-slate-700/40 border-slate-400/50 border-dashed",
  };
  return cn("rounded-lg border flex items-center justify-center mx-4", h, styles[variant]);
}

function FaixaEixo({
  faixa,
  porPosicao,
  onInstalar,
  onDesinstalar,
}: {
  faixa: Extract<FaixaLayout, { tipo: "eixo" }>;
  porPosicao: Partial<Record<PosicaoPneu, Pneu>>;
  onInstalar: (id: string, pos: PosicaoPneu) => void;
  onDesinstalar: (id: string) => void;
}) {
  const renderSlot = (pos: PosicaoPneu) => (
    <TireSlot
      key={pos}
      posicao={pos}
      pneu={porPosicao[pos]}
      onDrop={(id) => onInstalar(id, pos)}
      onRemove={() => {
        const p = porPosicao[pos];
        if (p) onDesinstalar(p.id);
      }}
    />
  );

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-center text-muted-foreground font-medium">{faixa.titulo}</p>
      {faixa.dual ? (
        <div className="flex items-center justify-center gap-1">
          {faixa.posicoes.slice(0, 2).map(renderSlot)}
          <div className="w-8" />
          {faixa.posicoes.slice(2, 4).map(renderSlot)}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-4">
          {faixa.posicoes.map(renderSlot)}
        </div>
      )}
    </div>
  );
}

function FaixaCorpo({ faixa }: { faixa: Extract<FaixaLayout, { tipo: "corpo" }> }) {
  return (
    <div className={corpoClasses(faixa.variant, faixa.altura)}>
      <span className="text-xs text-muted-foreground px-2 text-center">{faixa.rotulo}</span>
    </div>
  );
}

function FaixaEstepe({
  faixa,
  porPosicao,
  onInstalar,
  onDesinstalar,
}: {
  faixa: Extract<FaixaLayout, { tipo: "estepe" }>;
  porPosicao: Partial<Record<PosicaoPneu, Pneu>>;
  onInstalar: (id: string, pos: PosicaoPneu) => void;
  onDesinstalar: (id: string) => void;
}) {
  const align =
    faixa.alinhamento === "esquerda"
      ? "justify-start pl-4"
      : faixa.alinhamento === "direita"
        ? "justify-end pr-4"
        : "justify-center";
  return (
    <div className={cn("flex", align)}>
      <TireSlot
        posicao="estepe"
        pneu={porPosicao.estepe}
        onDrop={(id) => onInstalar(id, "estepe")}
        onRemove={() => {
          const p = porPosicao.estepe;
          if (p) onDesinstalar(p.id);
        }}
      />
    </div>
  );
}

function EstoquePanel({ pneus }: { pneus: Pneu[] }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-sm">Estoque disponível</h3>
        <p className="text-xs text-muted-foreground">{pneus.length} pneu(s) — arraste para instalar</p>
      </div>
      <div className="space-y-2 max-h-[420px] overflow-y-auto">
        {pneus.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum pneu em estoque.</p>
        )}
        {pneus.map((p) => (
          <div
            key={p.id}
            draggable
            className="flex flex-col gap-1 rounded-lg border p-2 cursor-grab active:cursor-grabbing bg-background hover:bg-accent/50 transition-colors"
            onDragStart={(e) => {
              e.dataTransfer.setData("text/pneu-id", p.id);
              e.dataTransfer.effectAllowed = "move";
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{p.codigo_fogo}</span>
              <Badge variant="outline" className="text-[10px]">
                {p.medida}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {p.marca}
              {p.modelo ? ` ${p.modelo}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TireLayout({
  veiculo,
  pneusInstalados,
  pneusEstoque,
  onInstalar,
  onDesinstalar,
}: Props) {
  const { perfil, faixas } = layoutVisualVeiculo(veiculo);
  const porPosicao = pneusPorPosicao(pneusInstalados);
  const eixosAtivos = veiculo.numero_eixos ?? perfil.eixosPadrao;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
      <div className="rounded-xl border bg-muted/30 p-6 space-y-4">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Vista superior — {veiculo.tipo_veiculo}</p>
          <p className="text-xs text-muted-foreground">{perfil.titulo} · {perfil.descricao}</p>
          <p className="text-[10px] text-muted-foreground">
            {eixosAtivos} eixo(s) · arraste pneus do estoque para as posições
          </p>
        </div>

        <div className="mx-auto max-w-xl space-y-3">
          <div className="h-1.5 bg-muted-foreground/20 rounded-full mx-10" />
          {faixas.map((faixa, i) => {
            if (faixa.tipo === "eixo") {
              return (
                <FaixaEixo
                  key={`eixo-${i}`}
                  faixa={faixa}
                  porPosicao={porPosicao}
                  onInstalar={onInstalar}
                  onDesinstalar={onDesinstalar}
                />
              );
            }
            if (faixa.tipo === "corpo") {
              return <FaixaCorpo key={`corpo-${i}`} faixa={faixa} />;
            }
            if (faixa.tipo === "espacador") {
              return (
                <div key={`esp-${i}`} className="flex items-center gap-2 py-1 mx-8">
                  <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">{faixa.rotulo}</span>
                  <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                </div>
              );
            }
            if (faixa.tipo === "estepe") {
              return (
                <FaixaEstepe
                  key={`estepe-${i}`}
                  faixa={faixa}
                  porPosicao={porPosicao}
                  onInstalar={onInstalar}
                  onDesinstalar={onDesinstalar}
                />
              );
            }
            return null;
          })}
          <div className="h-1.5 bg-muted-foreground/20 rounded-full mx-10" />
        </div>
      </div>

      <EstoquePanel pneus={pneusEstoque} />
    </div>
  );
}

