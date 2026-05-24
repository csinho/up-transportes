import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  acharMarcaPorNome,
  acharModeloPorNome,
  parseAnoFipe,
  type FipeCategoria,
} from "@/lib/fipe-api";
import { useFipeAnos, useFipeMarcas, useFipeModelos } from "@/hooks/use-fipe-veiculo";

type Valores = {
  marca?: string;
  modelo?: string;
  ano_modelo?: number;
  ano_fabricacao?: number;
};

type Props = {
  values: Valores;
  onChange: (patch: Valores) => void;
  categoria?: FipeCategoria;
};

export function VeiculoFipeSelects({ values, onChange, categoria = "caminhoes" }: Props) {
  const [marcaCodigo, setMarcaCodigo] = useState("");
  const [modeloCodigo, setModeloCodigo] = useState("");
  const [modeloOpen, setModeloOpen] = useState(false);

  const { data: marcas = [], isLoading: loadingMarcas, isError: erroMarcas } = useFipeMarcas(categoria);
  const { data: modelosResp, isLoading: loadingModelos, isError: erroModelos } = useFipeModelos(
    categoria,
    marcaCodigo || undefined,
  );
  const { data: anos = [], isLoading: loadingAnos, isError: erroAnos } = useFipeAnos(
    categoria,
    marcaCodigo || undefined,
    modeloCodigo || undefined,
  );

  const modelos = modelosResp?.modelos ?? [];

  useEffect(() => {
    if (!marcas.length) return;
    const found = acharMarcaPorNome(marcas, values.marca);
    setMarcaCodigo(found?.codigo ?? "");
  }, [marcas, values.marca]);

  useEffect(() => {
    if (!modelos.length) {
      setModeloCodigo("");
      return;
    }
    const found = acharModeloPorNome(modelos, values.modelo);
    setModeloCodigo(found ? String(found.codigo) : "");
  }, [modelos, values.modelo]);

  const marcaLegada = useMemo(() => {
    if (!values.marca || !marcas.length) return false;
    return !acharMarcaPorNome(marcas, values.marca);
  }, [values.marca, marcas]);

  const modeloLegado = useMemo(() => {
    if (!values.modelo || !modelos.length) return false;
    return !acharModeloPorNome(modelos, values.modelo);
  }, [values.modelo, modelos]);

  const anoSelecionado = values.ano_modelo ? String(values.ano_modelo) : "";

  const handleMarca = (codigo: string) => {
    const marca = marcas.find((m) => m.codigo === codigo);
    setMarcaCodigo(codigo);
    setModeloCodigo("");
    onChange({ marca: marca?.nome, modelo: undefined, ano_modelo: undefined, ano_fabricacao: undefined });
  };

  const handleModelo = (codigo: string) => {
    const modelo = modelos.find((m) => String(m.codigo) === codigo);
    setModeloCodigo(codigo);
    setModeloOpen(false);
    onChange({ ...values, modelo: modelo?.nome, ano_modelo: undefined, ano_fabricacao: undefined });
  };

  const handleAno = (anoLabel: string) => {
    const ano = parseAnoFipe(anoLabel);
    onChange({ ...values, ano_modelo: ano, ano_fabricacao: ano });
  };

  const erro = erroMarcas || erroModelos || erroAnos;

  return (
    <div className="col-span-2 md:col-span-3 space-y-3 rounded-lg border bg-muted/30 p-3">
      <div>
        <p className="text-sm font-medium">Marca, modelo e ano (tabela FIPE — caminhões)</p>
        <p className="text-xs text-muted-foreground">
          Dados padronizados para reduzir erros de digitação. Selecione na ordem: marca → modelo → ano.
        </p>
      </div>

      {erro && (
        <p className="text-xs text-destructive">
          Não foi possível carregar a tabela FIPE. Verifique sua conexão e tente novamente.
        </p>
      )}

      {marcaLegada && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Marca atual &quot;{values.marca}&quot; não consta na FIPE. Selecione uma marca válida abaixo.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Marca *</Label>
          <Select value={marcaCodigo || undefined} onValueChange={handleMarca} disabled={loadingMarcas}>
            <SelectTrigger>
              <SelectValue placeholder={loadingMarcas ? "Carregando…" : "Selecione a marca"} />
            </SelectTrigger>
            <SelectContent>
              {marcas.map((m) => (
                <SelectItem key={m.codigo} value={m.codigo}>{m.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Modelo *</Label>
          <Popover open={modeloOpen} onOpenChange={setModeloOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={modeloOpen}
                disabled={!marcaCodigo || loadingModelos}
                className="w-full justify-between font-normal"
              >
                {loadingModelos ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                  </span>
                ) : values.modelo ? (
                  <span className="truncate">{values.modelo}</span>
                ) : (
                  <span className="text-muted-foreground">Buscar modelo…</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Digite para filtrar…" />
                <CommandList>
                  <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                  <CommandGroup>
                    {modeloLegado && values.modelo && (
                      <CommandItem value={values.modelo} onSelect={() => setModeloOpen(false)}>
                        (atual) {values.modelo}
                      </CommandItem>
                    )}
                    {modelos.map((m) => (
                      <CommandItem
                        key={m.codigo}
                        value={m.nome}
                        onSelect={() => handleModelo(String(m.codigo))}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            String(m.codigo) === modeloCodigo ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{m.nome}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Ano *</Label>
          <Select
            value={anoSelecionado || undefined}
            onValueChange={handleAno}
            disabled={!modeloCodigo || loadingAnos}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingAnos ? "Carregando…" : "Selecione o ano"} />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a.codigo} value={a.nome}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
