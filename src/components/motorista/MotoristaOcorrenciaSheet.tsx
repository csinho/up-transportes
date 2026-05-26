import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TipoViagemOcorrencia, GravidadeOcorrencia } from "@/types";
import { GRAVIDADE_OCORRENCIA, TIPOS_VIAGEM_OCORRENCIA } from "@/types";
import { requestMotoristaLocationOnce } from "@/lib/motorista-geolocation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type OcorrenciaFormData = {
  tipo: TipoViagemOcorrencia;
  gravidade: GravidadeOcorrencia;
  titulo: string;
  descricao: string;
  latitude: number;
  longitude: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OcorrenciaFormData) => void | Promise<void>;
  loading?: boolean;
};

export function MotoristaOcorrenciaSheet({ open, onOpenChange, onSubmit, loading }: Props) {
  const [form, setForm] = useState({
    tipo: "outro" as TipoViagemOcorrencia,
    gravidade: "media" as GravidadeOcorrencia,
    titulo: "",
    descricao: "",
  });
  const [capturandoGps, setCapturandoGps] = useState(false);

  const reset = () => {
    setForm({ tipo: "outro", gravidade: "media", titulo: "", descricao: "" });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const enviar = () => {
    void (async () => {
      setCapturandoGps(true);
      try {
        const pos = await requestMotoristaLocationOnce();
        if (!pos) {
          toast.error("Não foi possível obter a localização. Verifique o GPS e tente novamente.");
          return;
        }

        await onSubmit({
          ...form,
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        reset();
      } finally {
        setCapturandoGps(false);
      }
    })();
  };

  const valido = form.titulo.trim().length >= 3 && form.descricao.trim().length >= 10;
  const busy = loading || capturandoGps;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Registrar ocorrência
          </SheetTitle>
          <SheetDescription>
            Descreva o problema. A transportadora será notificada e a localização será registrada
            automaticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm({ ...form, tipo: v as TipoViagemOcorrencia })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_VIAGEM_OCORRENCIA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gravidade</Label>
              <Select
                value={form.gravidade}
                onValueChange={(v) => setForm({ ...form, gravidade: v as GravidadeOcorrencia })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRAVIDADE_OCORRENCIA.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-titulo">Título *</Label>
            <Input
              id="oc-titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex.: Pneu furado na BR-277"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oc-desc">Descrição *</Label>
            <Textarea
              id="oc-desc"
              rows={4}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Detalhe o que aconteceu, local aproximado, necessidade de apoio…"
            />
            <p className="text-xs text-muted-foreground">Mínimo 10 caracteres na descrição.</p>
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" size="lg" onClick={enviar} disabled={busy || !valido}>
            {capturandoGps ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Obtendo localização…
              </>
            ) : loading ? (
              "Salvando…"
            ) : (
              "Registrar ocorrência"
            )}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
