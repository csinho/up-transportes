import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Loader2, Power, PowerOff } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransportadoraFeedbackPanel } from "@/components/plataforma/TransportadoraFeedbackPanel";
import {
  usePlatformTransportadora,
  useSetTransportadoraAtiva,
} from "@/hooks/use-plataforma";
import { PLANO_LABELS } from "@/lib/supabase/plataforma";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { maskCNPJ, maskPhone } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/plataforma/transportadoras/$id")({
  head: () => ({ meta: [{ title: "Transportadora — Plataforma" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { data, isPending, isError, error } = usePlatformTransportadora(id);
  const setAtiva = useSetTransportadoraAtiva();
  const [motivo, setMotivo] = useState("");
  const [showMotivo, setShowMotivo] = useState(false);

  const toggleAtiva = () => {
    if (!data) return;

    if (data.ativa) {
      if (!showMotivo) {
        setShowMotivo(true);
        return;
      }
      setAtiva.mutate(
        { id, ativa: false, motivo: motivo.trim() || "Suspensa pela plataforma" },
        {
          onSuccess: () => {
            toast.success("Transportadora inativada.");
            setShowMotivo(false);
            setMotivo("");
          },
          onError: (err) => toast.error(traduzirErroSupabase(err)),
        },
      );
      return;
    }

    setAtiva.mutate(
      { id, ativa: true },
      {
        onSuccess: () => toast.success("Transportadora reativada."),
        onError: (err) => toast.error(traduzirErroSupabase(err)),
      },
    );
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/plataforma/transportadoras">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
        <p className="text-destructive text-sm">{error ? traduzirErroSupabase(error) : "Não encontrada."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/plataforma/transportadoras">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data.nome_fantasia}</h1>
          <p className="text-sm text-muted-foreground">{data.razao_social}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={data.ativa ? "secondary" : "destructive"}>
              {data.ativa ? "Ativa" : "Inativa"}
            </Badge>
            <Badge variant="outline">{PLANO_LABELS[data.plano] ?? data.plano}</Badge>
          </div>
        </div>
        <Button
          variant={data.ativa ? "destructive" : "default"}
          disabled={setAtiva.isPending}
          onClick={toggleAtiva}
          className="gap-2"
        >
          {setAtiva.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : data.ativa ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          {data.ativa ? "Inativar" : "Reativar"}
        </Button>
      </div>

      {showMotivo && data.ativa && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Motivo da inativação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="motivo-suspensao">Motivo (opcional)</Label>
              <Input
                id="motivo-suspensao"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex.: inadimplência, solicitação do cliente…"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={toggleAtiva} disabled={setAtiva.isPending}>
                Confirmar inativação
              </Button>
              <Button variant="outline" onClick={() => setShowMotivo(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 mt-0">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">CNPJ:</span>{" "}
              {data.cnpj ? maskCNPJ(data.cnpj) : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">E-mail:</span> {data.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Telefone:</span>{" "}
              {data.telefone_principal ? maskPhone(data.telefone_principal) : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Trial até:</span>{" "}
              {data.trial_ate
                ? format(new Date(data.trial_ate), "dd/MM/yyyy", { locale: ptBR })
                : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Criada em:</span>{" "}
              {format(new Date(data.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {!data.ativa && data.motivo_suspensao && (
              <p className="text-destructive">
                <span className="font-medium">Motivo:</span> {data.motivo_suspensao}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uso</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Viagens:</span>{" "}
              <strong>{data.total_viagens}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Motoristas:</span>{" "}
              <strong>{data.total_motoristas}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Colaboradores:</span>{" "}
              <strong>{data.colaboradores.length}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colaboradores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.colaboradores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Nenhum colaborador.
                  </TableCell>
                </TableRow>
              ) : (
                data.colaboradores.map((c, i) => (
                  <TableRow key={`${c.email}-${i}`}>
                    <TableCell>
                      <p className="font-medium text-sm">{c.nome || c.email}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </TableCell>
                    <TableCell className="capitalize">{c.role}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ativo" ? "secondary" : "outline"}>
                        {c.status === "ativo" ? "Ativo" : "Convite pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Assinaturas Stripe e limites por plano — próxima fase (ver plano.md).
      </p>
        </TabsContent>

        <TabsContent value="feedback" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feedback e bugs reportados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TransportadoraFeedbackPanel transportadoraId={data.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
