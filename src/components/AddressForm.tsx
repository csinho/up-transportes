import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Endereco } from "@/types";
import { fetchViaCep } from "@/lib/viacep";
import { maskCEP, onlyDigits } from "@/lib/masks";
import { Loader2 } from "lucide-react";

interface Props {
  value: Endereco;
  onChange: (e: Endereco) => void;
}

export function AddressForm({ value, onChange }: Props) {
  const [loading, setLoading] = useState(false);

  const handleCep = async (cep: string) => {
    const masked = maskCEP(cep);
    onChange({ ...value, cep: masked });
    if (onlyDigits(masked).length === 8) {
      setLoading(true);
      const data = await fetchViaCep(masked);
      setLoading(false);
      if (data) onChange({ ...value, ...data, cep: masked });
    }
  };

  const set = <K extends keyof Endereco>(k: K, v: Endereco[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
      <div className="lg:col-span-2">
        <Label>CEP</Label>
        <div className="relative">
          <Input value={value.cep ?? ""} onChange={(e) => handleCep(e.target.value)} placeholder="00000-000" />
          {loading && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>
      <div className="md:col-span-1 lg:col-span-5">
        <Label>Logradouro</Label>
        <Input value={value.logradouro ?? ""} onChange={(e) => set("logradouro", e.target.value)} />
      </div>
      <div className="lg:col-span-2">
        <Label>Número</Label>
        <Input value={value.numero ?? ""} onChange={(e) => set("numero", e.target.value)} />
      </div>
      <div className="lg:col-span-3">
        <Label>Complemento</Label>
        <Input value={value.complemento ?? ""} onChange={(e) => set("complemento", e.target.value)} />
      </div>
      <div className="lg:col-span-3">
        <Label>Bairro</Label>
        <Input value={value.bairro ?? ""} onChange={(e) => set("bairro", e.target.value)} />
      </div>
      <div className="lg:col-span-4">
        <Label>Cidade</Label>
        <Input value={value.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
      </div>
      <div className="lg:col-span-1">
        <Label>UF</Label>
        <Input
          value={value.uf ?? ""}
          maxLength={2}
          onChange={(e) => set("uf", e.target.value.toUpperCase())}
        />
      </div>
      <div className="lg:col-span-4">
        <Label>País</Label>
        <Input value={value.pais ?? "Brasil"} onChange={(e) => set("pais", e.target.value)} />
      </div>
    </div>
  );
}
