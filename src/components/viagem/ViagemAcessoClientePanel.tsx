import { useState } from "react";
import { Copy, ExternalLink, Link2, Loader2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAcessosClienteViagem,
  useCriarAcessoCliente,
  useRevogarAcessoCliente,
} from "@/hooks/use-viagem-acesso-cliente";
import { acompanharUrl } from "@/lib/acompanhar-app-path";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import type { UUID } from "@/types";
import { toast } from "sonner";

type Props = {
  viagemId: UUID;
  numeroViagem: number;
};

export function ViagemAcessoClientePanel({ viagemId, numeroViagem }: Props) {
  const { data: acessos = [], isPending } = useAcessosClienteViagem(viagemId);
  const criar = useCriarAcessoCliente(viagemId);
  const revogar = useRevogarAcessoCliente(viagemId);
  const [titulo, setTitulo] = useState("");

  const ativo = acessos.find((a) => a.ativo);

  const copiar = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error(`Copie manualmente: ${url}`);
    }
  };

  const gerar = () => {
    criar.mutate(titulo.trim() || undefined, {
      onSuccess: (row) => {
        setTitulo("");
        toast.success("Link de acompanhamento gerado!");
        void copiar(acompanharUrl(row.token));
      },
      onError: (err) => toast.error(traduzirErroSupabase(err)),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Acompanhamento para o cliente
        </CardTitle>
        <CardDescription>
          Gere um link exclusivo para o cliente visualizar <strong>apenas esta viagem</strong> em
          tempo real — mapa, progresso e status. Sem acesso ao ERP, motorista ou outros dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="titulo-cliente">Nome do cliente (opcional)</Label>
            <Input
              id="titulo-cliente"
              placeholder="Ex.: Cliente ABC — carga #123"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <Button onClick={gerar} disabled={criar.isPending} className="gap-2">
            {criar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {ativo ? "Atualizar link" : "Gerar link"}
          </Button>
        </div>

        {isPending ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : ativo ? (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Link ativo</Badge>
              {ativo.titulo && <span className="text-sm font-medium">{ativo.titulo}</span>}
            </div>
            <p className="text-xs text-muted-foreground break-all font-mono">
              {acompanharUrl(ativo.token)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void copiar(acompanharUrl(ativo.token))}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copiar link
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={acompanharUrl(ativo.token)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Abrir
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={revogar.isPending}
                onClick={() =>
                  revogar.mutate(ativo.token, {
                    onSuccess: () => toast.success("Link revogado."),
                    onError: (err) => toast.error(traduzirErroSupabase(err)),
                  })
                }
              >
                <ShieldOff className="h-3.5 w-3.5 mr-1" />
                Revogar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum link ativo para a viagem #{String(numeroViagem).padStart(5, "0")}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
