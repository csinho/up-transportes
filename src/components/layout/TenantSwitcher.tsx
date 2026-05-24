import { useTransportadoras, getActiveTransportadoraId, setActiveTransportadoraId } from "@/data/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function TenantSwitcher() {
  const { data: transportadoras = [] } = useTransportadoras();
  const qc = useQueryClient();
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const stored = getActiveTransportadoraId();
    if (stored && transportadoras.some((t) => t.id === stored)) {
      setActive(stored);
      return;
    }
    if (transportadoras[0]) {
      setActiveTransportadoraId(transportadoras[0].id);
      setActive(transportadoras[0].id);
    }
  }, [transportadoras]);

  if (!transportadoras.length) return null;

  return (
    <Select
      value={active}
      onValueChange={(v) => {
        setActiveTransportadoraId(v);
        setActive(v);
        qc.invalidateQueries();
      }}
    >
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder="Transportadora ativa" />
      </SelectTrigger>
      <SelectContent>
        {transportadoras.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.nome_fantasia || t.razao_social}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
