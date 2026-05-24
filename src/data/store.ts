/**
 * Camada de dados — Supabase (React Query).
 * Requer VITE_SUPABASE_* e sessão auth (ERP ou motorista).
 */
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Transportadora,
  Motorista,
  Veiculo,
  Cliente,
  ProdutoCarga,
  Viagem,
  ViagemEvento,
  ViagemOcorrencia,
  ViagemLocalizacao,
  Fornecedor,
  Pneu,
  LancamentoFinanceiro,
  UUID,
  PosicaoPneu,
} from "@/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireSupabaseSession } from "@/lib/supabase/session";
import * as sb from "@/data/supabase-repository";

type Tables = {
  transportadoras: Transportadora;
  motoristas: Motorista;
  veiculos: Veiculo;
  clientes: Cliente;
  produtos: ProdutoCarga;
  viagens: Viagem;
  viagem_eventos: ViagemEvento;
  viagem_ocorrencias: ViagemOcorrencia;
  viagem_localizacoes: ViagemLocalizacao;
  fornecedores: Fornecedor;
  pneus: Pneu;
  lancamentos: LancamentoFinanceiro;
};

const ACTIVE_KEY = "erp_transp_active_v6";

export const DB_CHANGE_EVENT = "erp-transp-db-change";

async function assertDataAccess(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local");
  }
  if (!(await requireSupabaseSession())) {
    throw new Error("Faça login para continuar.");
  }
}

export function getActiveTransportadoraId(): UUID {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACTIVE_KEY) ?? "";
}

export function setActiveTransportadoraId(id: UUID) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_KEY, id);
  window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT));
}

function invalidateRecursosQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["viagens"] });
  qc.invalidateQueries({ queryKey: ["motoristas"] });
  qc.invalidateQueries({ queryKey: ["veiculos"] });
}

export function invalidateMotoristaData(qc: ReturnType<typeof useQueryClient>) {
  invalidateRecursosQueries(qc);
  qc.invalidateQueries({ queryKey: ["viagem_eventos"] });
  qc.invalidateQueries({ queryKey: ["viagem_ocorrencias"] });
  qc.invalidateQueries({ queryKey: ["viagem_localizacoes"] });
}

export async function persistViagem(record: Viagem): Promise<Viagem> {
  await assertDataAccess();
  return sb.sbUpsertViagem(record);
}

export async function persistViagemEvento(record: ViagemEvento): Promise<ViagemEvento> {
  await assertDataAccess();
  return sb.sbUpsertViagemEvento(record);
}

export async function persistViagemOcorrencia(record: ViagemOcorrencia): Promise<ViagemOcorrencia> {
  await assertDataAccess();
  return sb.sbUpsertViagemOcorrencia(record);
}

export async function persistViagemLocalizacao(record: ViagemLocalizacao): Promise<ViagemLocalizacao> {
  await assertDataAccess();
  return sb.sbUpsertViagemLocalizacao(record);
}

function useTenantList<K extends keyof Tables>(table: K) {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: [table, tenant],
    enabled: !!tenant,
    queryFn: async () => {
      await assertDataAccess();
      switch (table) {
        case "motoristas":
          return sb.sbListMotoristas(tenant) as Tables[K][];
        case "veiculos":
          return sb.sbListVeiculos(tenant) as Tables[K][];
        case "clientes":
          return sb.sbListClientes(tenant) as Tables[K][];
        case "produtos":
          return sb.sbListProdutos(tenant) as Tables[K][];
        case "viagens":
          return sb.sbListViagens(tenant) as Tables[K][];
        default:
          return [] as Tables[K][];
      }
    },
  });
}

function useEntity<K extends keyof Tables>(table: K, id: UUID | undefined) {
  return useQuery({
    queryKey: [table, "one", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      await assertDataAccess();
      switch (table) {
        case "transportadoras":
          return sb.sbGetTransportadora(id);
        case "motoristas":
          return sb.sbGetMotorista(id);
        case "veiculos":
          return sb.sbGetVeiculo(id);
        case "clientes":
          return sb.sbGetCliente(id);
        case "produtos":
          return sb.sbGetProduto(id);
        case "viagens":
          return sb.sbGetViagem(id);
        default:
          return null;
      }
    },
  });
}

function useUpsert<K extends keyof Tables>(table: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rec: Tables[K]) => {
      await assertDataAccess();
      switch (table) {
        case "transportadoras":
          return sb.sbUpsertTransportadora(rec as Transportadora) as Tables[K];
        case "motoristas":
          return sb.sbUpsertMotorista(rec as Motorista) as Tables[K];
        case "veiculos":
          return sb.sbUpsertVeiculo(rec as Veiculo) as Tables[K];
        case "clientes":
          return sb.sbUpsertCliente(rec as Cliente) as Tables[K];
        case "produtos":
          return sb.sbUpsertProduto(rec as ProdutoCarga) as Tables[K];
        case "viagens":
          return sb.sbUpsertViagem(rec as Viagem) as Tables[K];
        case "viagem_eventos":
          return sb.sbUpsertViagemEvento(rec as ViagemEvento) as Tables[K];
        case "viagem_ocorrencias":
          return sb.sbUpsertViagemOcorrencia(rec as ViagemOcorrencia) as Tables[K];
        case "viagem_localizacoes":
          return sb.sbUpsertViagemLocalizacao(rec as ViagemLocalizacao) as Tables[K];
        default:
          throw new Error(`Entidade "${String(table)}" não disponível no Supabase.`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      if (table === "viagens") invalidateRecursosQueries(qc);
    },
  });
}

function useRemove<K extends keyof Tables>(table: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: UUID) => {
      await assertDataAccess();
      switch (table) {
        case "motoristas":
          return sb.sbRemoveMotorista(id);
        case "veiculos":
          return sb.sbRemoveVeiculo(id);
        case "clientes":
          return sb.sbRemoveCliente(id);
        case "produtos":
          return sb.sbRemoveProduto(id);
        case "viagens":
          return sb.sbRemoveViagem(id);
        default:
          throw new Error(`Remoção de "${String(table)}" não disponível no Supabase.`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      if (table === "viagens") invalidateRecursosQueries(qc);
    },
  });
}

export function useActiveTenantId() {
  const [id, setId] = useState<UUID>(() =>
    typeof window === "undefined" ? "" : getActiveTransportadoraId(),
  );

  useEffect(() => {
    const refresh = () => setId(getActiveTransportadoraId());
    refresh();
    window.addEventListener(DB_CHANGE_EVENT, refresh);
    window.addEventListener("motorista-session", refresh);
    return () => {
      window.removeEventListener(DB_CHANGE_EVENT, refresh);
      window.removeEventListener("motorista-session", refresh);
    };
  }, []);

  return id;
}

export const useTransportadoras = () =>
  useQuery({
    queryKey: ["transportadoras"],
    queryFn: async () => {
      await assertDataAccess();
      return sb.sbListTransportadoras();
    },
  });

export const useTransportadora = (id: UUID | undefined) => useEntity("transportadoras", id);
export const useSaveTransportadora = () => useUpsert("transportadoras");

export const useMotoristas = () => useTenantList("motoristas");
export const useMotorista = (id: UUID | undefined) => useEntity("motoristas", id);
export const useSaveMotorista = () => useUpsert("motoristas");
export const useRemoveMotorista = () => useRemove("motoristas");

export const useVeiculos = () => useTenantList("veiculos");
export const useVeiculo = (id: UUID | undefined) => useEntity("veiculos", id);
export const useSaveVeiculo = () => useUpsert("veiculos");
export const useRemoveVeiculo = () => useRemove("veiculos");

export const useClientes = () => useTenantList("clientes");
export const useCliente = (id: UUID | undefined) => useEntity("clientes", id);
export const useSaveCliente = () => useUpsert("clientes");
export const useRemoveCliente = () => useRemove("clientes");

export const useProdutos = () => useTenantList("produtos");
export const useProduto = (id: UUID | undefined) => useEntity("produtos", id);
export const useSaveProduto = () => useUpsert("produtos");
export const useRemoveProduto = () => useRemove("produtos");

export const useViagens = () => useTenantList("viagens");
export const useViagem = (id: UUID | undefined) => useEntity("viagens", id);

export const useSaveViagem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rec: Viagem) => {
      await assertDataAccess();
      return sb.sbUpsertViagem(rec);
    },
    onSuccess: () => invalidateRecursosQueries(qc),
  });
};

export const useRemoveViagem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: UUID) => {
      await assertDataAccess();
      return sb.sbRemoveViagem(id);
    },
    onSuccess: () => invalidateRecursosQueries(qc),
  });
};

type ViagemSubListOptions = {
  pollMs?: number;
};

function useViagemSubList<T extends { transportadora_id: UUID; viagem_id: UUID; created_at: string }>(
  table: "viagem_eventos" | "viagem_ocorrencias" | "viagem_localizacoes",
  viagemId: UUID | undefined,
  sortFn?: (a: T, b: T) => number,
  options?: ViagemSubListOptions,
) {
  const tenant = useActiveTenantId();
  const queryKey = [table, tenant, viagemId] as const;

  return useQuery({
    queryKey,
    enabled: !!viagemId && !!tenant,
    queryFn: async () => {
      await assertDataAccess();
      let rows: ViagemEvento[] | ViagemOcorrencia[] | ViagemLocalizacao[];
      if (table === "viagem_eventos") {
        rows = await sb.sbListViagemEventos(tenant, viagemId);
      } else if (table === "viagem_ocorrencias") {
        rows = await sb.sbListViagemOcorrencias(tenant, viagemId);
      } else {
        rows = await sb.sbListViagemLocalizacoes(tenant, viagemId);
      }
      if (sortFn) rows = [...rows].sort(sortFn as (a: typeof rows[0], b: typeof rows[0]) => number);
      return rows as T[];
    },
    refetchInterval: options?.pollMs,
  });
}

export const useViagemEventos = (viagemId: UUID | undefined) =>
  useViagemSubList<ViagemEvento>("viagem_eventos", viagemId, (a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

export const useViagemOcorrencias = (viagemId: UUID | undefined) =>
  useViagemSubList<ViagemOcorrencia>("viagem_ocorrencias", viagemId, (a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

export const useViagemLocalizacoes = (
  viagemId: UUID | undefined,
  options?: ViagemSubListOptions,
) =>
  useViagemSubList<ViagemLocalizacao>(
    "viagem_localizacoes",
    viagemId,
    (a, b) => new Date(b.registrado_em).getTime() - new Date(a.registrado_em).getTime(),
    options,
  );

export const useAllViagemLocalizacoes = (options?: ViagemSubListOptions) => {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: ["viagem_localizacoes", tenant, "all"],
    enabled: !!tenant,
    queryFn: async () => {
      await assertDataAccess();
      return sb.sbListViagemLocalizacoes(tenant);
    },
    refetchInterval: options?.pollMs,
  });
};

export const useSaveViagemEvento = () => useUpsert("viagem_eventos");
export const useSaveViagemOcorrencia = () => useUpsert("viagem_ocorrencias");
export const useSaveViagemLocalizacao = () => useUpsert("viagem_localizacoes");

export const useFornecedores = () =>
  useQuery({ queryKey: ["fornecedores"], queryFn: async () => [] as Fornecedor[], enabled: false });

export const useFornecedor = (_id: UUID | undefined) =>
  useQuery({ queryKey: ["fornecedores", "one", _id], queryFn: async () => null, enabled: false });

export const useSaveFornecedor = () =>
  useMutation({
    mutationFn: async () => {
      throw new Error("Fornecedores não disponível — módulo fora do escopo.");
    },
  });

export const useRemoveFornecedor = () =>
  useMutation({
    mutationFn: async () => {
      throw new Error("Fornecedores não disponível — módulo fora do escopo.");
    },
  });

export const usePneus = () =>
  useQuery({ queryKey: ["pneus"], queryFn: async () => [] as Pneu[], enabled: false });

export const usePneu = (_id: UUID | undefined) =>
  useQuery({ queryKey: ["pneus", "one", _id], queryFn: async () => null, enabled: false });

export const useSavePneu = () =>
  useMutation({
    mutationFn: async () => {
      throw new Error("Pneus não disponível — módulo fora do escopo.");
    },
  });

export const useRemovePneu = () =>
  useMutation({
    mutationFn: async () => {
      throw new Error("Pneus não disponível — módulo fora do escopo.");
    },
  });

export const useLancamentos = () =>
  useQuery({
    queryKey: ["lancamentos"],
    queryFn: async () => [] as LancamentoFinanceiro[],
    enabled: false,
  });

export const useLancamento = (_id: UUID | undefined) =>
  useQuery({ queryKey: ["lancamentos", "one", _id], queryFn: async () => null, enabled: false });

export const useSaveLancamento = () =>
  useMutation({
    mutationFn: async () => {
      throw new Error("Financeiro não disponível — módulo fora do escopo.");
    },
  });

export const useRemoveLancamento = () =>
  useMutation({
    mutationFn: async () => {
      throw new Error("Financeiro não disponível — módulo fora do escopo.");
    },
  });

export async function nextViagemNumero(transportadora_id: UUID): Promise<number> {
  await assertDataAccess();
  return sb.sbNextViagemNumero(transportadora_id);
}

export function instalarPneu(): never {
  throw new Error("Módulo de pneus não disponível.");
}

export function desinstalarPneu(): never {
  throw new Error("Módulo de pneus não disponível.");
}

export function pneusDoVeiculo(_veiculoId: UUID): Pneu[] {
  return [];
}

export function pneusEmEstoque(_transportadoraId: UUID): Pneu[] {
  return [];
}

export function useInstalarPneu() {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Módulo de pneus não disponível.");
    },
  });
}

export function useDesinstalarPneu() {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Módulo de pneus não disponível.");
    },
  });
}
