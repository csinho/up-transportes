import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCriarTransportadoraPlatform } from "@/hooks/use-plataforma";
import { PLANO_LABELS, type PlanoTransportadora } from "@/lib/supabase/plataforma";
import { traduzirErroSupabase } from "@/lib/supabase/traduzir-erro";
import { maskCNPJ } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/plataforma/transportadoras/nova")({
  head: () => ({ meta: [{ title: "Nova transportadora — Plataforma" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const criar = useCriarTransportadoraPlatform();
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plano, setPlano] = useState<PlanoTransportadora>("trial");

  const salvar = () => {
    if (!nomeFantasia.trim() || !razaoSocial.trim() || !ownerEmail.trim()) {
      toast.error("Preencha nome fantasia, razão social e e-mail do proprietário.");
      return;
    }

    criar.mutate(
      {
        nome_fantasia: nomeFantasia,
        razao_social: razaoSocial,
        owner_email: ownerEmail,
        cnpj: cnpj.replace(/\D/g, "") || undefined,
        plano,
      },
      {
        onSuccess: (id) => {
          toast.success("Transportadora criada! Owner convidado ou vinculado.");
          void navigate({ to: "/plataforma/transportadoras/$id", params: { id } });
        },
        onError: (err) => toast.error(traduzirErroSupabase(err)),
      },
    );
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/plataforma/transportadoras">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova transportadora</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Provisiona um novo tenant e convida o proprietário inicial por e-mail.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-fantasia">Nome fantasia *</Label>
            <Input
              id="nome-fantasia"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="razao-social">Razão social *</Label>
            <Input
              id="razao-social"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-email">E-mail do proprietário *</Label>
            <Input
              id="owner-email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@empresa.com.br"
            />
            <p className="text-xs text-muted-foreground">
              Se já tiver conta, ganha acesso imediato. Senão, convite em /login → Primeiro acesso.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Plano inicial</Label>
            <Select value={plano} onValueChange={(v) => setPlano(v as PlanoTransportadora)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PLANO_LABELS) as PlanoTransportadora[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLANO_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={salvar} disabled={criar.isPending} className="w-full gap-2">
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Criar transportadora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
