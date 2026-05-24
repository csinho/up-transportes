import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useActiveTenantId, useTransportadora, useSaveTransportadora } from "@/data/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressForm } from "@/components/AddressForm";
import { DocumentUploader } from "@/components/DocumentUploader";
import type { Transportadora } from "@/types";
import { maskCNPJ, maskCPF, maskPhone } from "@/lib/masks";
import { toast } from "sonner";

export const Route = createFileRoute("/transportadora")({
  head: () => ({ meta: [{ title: "Transportadora — Configuração" }] }),
  component: Page,
});

function Page() {
  const tenantId = useActiveTenantId();
  const { data: existing } = useTransportadora(tenantId);
  const save = useSaveTransportadora();
  const [form, setForm] = useState<Transportadora | null>(null);

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  if (!form) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  const set = <K extends keyof Transportadora>(k: K, v: Transportadora[K]) =>
    setForm({ ...form, [k]: v });

  const handleSave = () => {
    save.mutate({ ...form, updated_at: new Date().toISOString() });
    toast.success("Transportadora atualizada");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Configuração da Transportadora</h1>
          <p className="text-sm text-muted-foreground">
            Esses dados aparecerão em PDFs, relatórios e cabeçalhos.
          </p>
        </div>
        <Button onClick={handleSave}>Salvar</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label>Nome fantasia</Label>
            <Input value={form.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo_transportador} onValueChange={(v) => set("tipo_transportador", v as Transportadora["tipo_transportador"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TAC">TAC — Autônomo</SelectItem>
                <SelectItem value="ETC">ETC — Empresa</SelectItem>
                <SelectItem value="CTC">CTC — Cooperativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Label>Razão social</Label>
            <Input value={form.razao_social} onChange={(e) => set("razao_social", e.target.value)} />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input value={form.cnpj ?? ""} onChange={(e) => set("cnpj", maskCNPJ(e.target.value))} />
          </div>
          <div>
            <Label>CPF (TAC)</Label>
            <Input value={form.cpf ?? ""} onChange={(e) => set("cpf", maskCPF(e.target.value))} />
          </div>
          <div>
            <Label>RNTRC / ANTT</Label>
            <Input value={form.rntrc ?? ""} onChange={(e) => set("rntrc", e.target.value)} />
          </div>
          <div>
            <Label>Inscrição estadual</Label>
            <Input value={form.inscricao_estadual ?? ""} onChange={(e) => set("inscricao_estadual", e.target.value)} />
          </div>
          <div>
            <Label>Inscrição municipal</Label>
            <Input value={form.inscricao_municipal ?? ""} onChange={(e) => set("inscricao_municipal", e.target.value)} />
          </div>
          <div>
            <Label>Logo (URL)</Label>
            <Input value={form.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Telefone principal</Label>
            <Input value={form.telefone_principal ?? ""} onChange={(e) => set("telefone_principal", maskPhone(e.target.value))} />
          </div>
          <div>
            <Label>Telefone secundário</Label>
            <Input value={form.telefone_secundario ?? ""} onChange={(e) => set("telefone_secundario", maskPhone(e.target.value))} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label>Site</Label>
            <Input value={form.site ?? ""} onChange={(e) => set("site", e.target.value)} />
          </div>
          <div>
            <Label>Responsável</Label>
            <Input value={form.responsavel_nome ?? ""} onChange={(e) => set("responsavel_nome", e.target.value)} />
          </div>
          <div>
            <Label>CPF do responsável</Label>
            <Input value={form.responsavel_cpf ?? ""} onChange={(e) => set("responsavel_cpf", maskCPF(e.target.value))} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input value={form.responsavel_cargo ?? ""} onChange={(e) => set("responsavel_cargo", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm value={form.endereco} onChange={(e) => set("endereco", e)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} rows={4} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploader
            documentos={form.documentos}
            onChange={(docs) => set("documentos", docs)}
            tiposSugeridos={["Cartão CNPJ", "Comprovante de endereço", "Certificado RNTRC", "Contrato social", "Alvará"]}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Salvar configuração</Button>
      </div>
    </div>
  );
}
