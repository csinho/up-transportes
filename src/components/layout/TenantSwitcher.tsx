import { useEffect } from "react";
import {
  useTransportadoras,
  useTransportadora,
  getActiveTransportadoraId,
  setActiveTransportadoraId,
  useActiveTenantId,
} from "@/data/store";

/** Exibe o nome da transportadora ativa (um tenant por usuário no ERP). */
export function TenantSwitcher() {
  const tenantId = useActiveTenantId();
  const { data: transportadoras = [] } = useTransportadoras();
  const { data: transportadora } = useTransportadora(tenantId);

  useEffect(() => {
    const stored = getActiveTransportadoraId();
    if (stored && transportadoras.some((t) => t.id === stored)) return;
    if (transportadoras[0]) {
      setActiveTransportadoraId(transportadoras[0].id);
    }
  }, [transportadoras]);

  const nome =
    transportadora?.nome_fantasia ||
    transportadora?.razao_social ||
    transportadoras[0]?.nome_fantasia ||
    transportadoras[0]?.razao_social;

  if (!nome) return null;

  return (
    <span
      className="text-sm font-semibold text-foreground truncate max-w-[min(280px,40vw)]"
      title={nome}
    >
      {nome}
    </span>
  );
}
