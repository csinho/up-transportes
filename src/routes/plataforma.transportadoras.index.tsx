import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Eye, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlatformTransportadoras } from "@/hooks/use-plataforma";
import { PLANO_LABELS } from "@/lib/supabase/plataforma";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { maskCNPJ } from "@/lib/masks";

export const Route = createFileRoute("/plataforma/transportadoras/")({
  head: () => ({ meta: [{ title: "Transportadoras — Plataforma" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { data = [], isPending, isError, error, refetch } = usePlatformTransportadoras();

  const abrirDetalhe = (id: string) => {
    void navigate({ to: "/plataforma/transportadoras/$id", params: { id } });
  };

  const ativas = data.filter((t) => t.ativa).length;
  const inativas = data.length - ativas;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Transportadoras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie tenants, acompanhe planos e ative ou suspenda acesso ao ERP e ao app motorista.
          </p>
        </div>
        <Button asChild>
          <Link to="/plataforma/transportadoras/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova transportadora
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{ativas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{inativas}</p>
          </CardContent>
        </Card>
      </div>

      {isPending ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-center space-y-3">
            <p className="text-sm text-destructive">{traduzirErroSupabase(error)}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Nenhuma transportadora cadastrada.</p>
            <Button asChild>
              <Link to="/plataforma/transportadoras/nova">Criar a primeira</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transportadora</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Viagens</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => abrirDetalhe(t.id)}
                >
                  <TableCell>
                    <span className="font-medium">{t.nome_fantasia}</span>
                    <p className="text-xs text-muted-foreground">{t.razao_social}</p>
                  </TableCell>
                  <TableCell className="text-sm">{t.cnpj ? maskCNPJ(t.cnpj) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{PLANO_LABELS[t.plano] ?? t.plano}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.ativa ? "secondary" : "destructive"}>
                      {t.ativa ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.owner_email ?? "—"}</TableCell>
                  <TableCell className="text-right">{t.total_viagens}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(t.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Ver detalhes"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirDetalhe(t.id);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
