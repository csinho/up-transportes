/**
 * Store mockado em memória + persistência simples em localStorage.
 *
 * A intenção é manter assinatura compatível com uma futura migração para Supabase.
 * Para migrar:
 *  - Substituir cada `list/get/create/update/remove` por chamadas `supabase.from('tabela').*`
 *  - Manter os mesmos shapes definidos em src/types
 *  - Aplicar RLS por transportadora_id no banco
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Transportadora,
  Motorista,
  Veiculo,
  Cliente,
  ProdutoCarga,
  Viagem,
  Fornecedor,
  Pneu,
  LancamentoFinanceiro,
  UUID,
  PosicaoPneu,
} from "@/types";

type Tables = {
  transportadoras: Transportadora;
  motoristas: Motorista;
  veiculos: Veiculo;
  clientes: Cliente;
  produtos: ProdutoCarga;
  viagens: Viagem;
  fornecedores: Fornecedor;
  pneus: Pneu;
  lancamentos: LancamentoFinanceiro;
};

const STORAGE_KEY = "erp_transp_db_v1";
const ACTIVE_KEY = "erp_transp_active_v1";

type DB = {
  transportadoras: Transportadora[];
  motoristas: Motorista[];
  veiculos: Veiculo[];
  clientes: Cliente[];
  produtos: ProdutoCarga[];
  viagens: Viagem[];
  fornecedores: Fornecedor[];
  pneus: Pneu[];
  lancamentos: LancamentoFinanceiro[];
};

function emptyDB(): DB {
  return {
    transportadoras: [],
    motoristas: [],
    veiculos: [],
    clientes: [],
    produtos: [],
    viagens: [],
    fornecedores: [],
    pneus: [],
    lancamentos: [],
  };
}

function seedDB(): DB {
  const now = new Date().toISOString();
  const tId = crypto.randomUUID();
  const t: Transportadora = {
    id: tId,
    nome_fantasia: "Transportes Exemplo",
    razao_social: "Transportes Exemplo LTDA",
    cnpj: "00.000.000/0001-00",
    tipo_transportador: "ETC",
    rntrc: "12345678",
    telefone_principal: "(11) 99999-0000",
    email: "contato@exemplo.com.br",
    endereco: {
      cep: "01001-000",
      logradouro: "Praça da Sé",
      numero: "100",
      bairro: "Sé",
      cidade: "São Paulo",
      uf: "SP",
      pais: "Brasil",
    },
    documentos: [],
    created_at: now,
    updated_at: now,
  };
  return { ...emptyDB(), transportadoras: [t] };
}

function loadDB(): DB {
  if (typeof window === "undefined") return emptyDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedDB();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as DB;
    return { ...emptyDB(), ...parsed };
  } catch {
    return seedDB();
  }
}

function saveDB(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let _db: DB | null = null;
function db(): DB {
  if (!_db) _db = loadDB();
  return _db;
}

export function getActiveTransportadoraId(): UUID {
  if (typeof window === "undefined") return db().transportadoras[0]?.id ?? "";
  const stored = localStorage.getItem(ACTIVE_KEY);
  if (stored && db().transportadoras.some((t) => t.id === stored)) return stored;
  const first = db().transportadoras[0]?.id ?? "";
  if (first) localStorage.setItem(ACTIVE_KEY, first);
  return first;
}

export function setActiveTransportadoraId(id: UUID) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_KEY, id);
}

// CRUD genérico
function list<K extends keyof Tables>(table: K): Tables[K][] {
  return db()[table] as Tables[K][];
}

function get<K extends keyof Tables>(table: K, id: UUID): Tables[K] | undefined {
  return list(table).find((r) => (r as { id: UUID }).id === id);
}

function upsert<K extends keyof Tables>(table: K, record: Tables[K]): Tables[K] {
  const arr = db()[table] as Tables[K][];
  const idx = arr.findIndex((r) => (r as { id: UUID }).id === (record as { id: UUID }).id);
  if (idx >= 0) arr[idx] = record;
  else arr.push(record);
  saveDB(db());
  return record;
}

function remove<K extends keyof Tables>(table: K, id: UUID) {
  const arr = db()[table] as Tables[K][];
  const idx = arr.findIndex((r) => (r as { id: UUID }).id === id);
  if (idx >= 0) {
    arr.splice(idx, 1);
    saveDB(db());
  }
}

// Hooks reutilizáveis ─────────────────────────────────────────────────────────

function useTenantList<K extends keyof Tables>(table: K) {
  const tenant = useActiveTenantId();
  return useQuery({
    queryKey: [table, tenant],
    queryFn: () =>
      list(table).filter((r) => {
        if (table === "transportadoras") return true;
        return (r as { transportadora_id?: UUID }).transportadora_id === tenant;
      }),
  });
}

function useEntity<K extends keyof Tables>(table: K, id: UUID | undefined) {
  return useQuery({
    queryKey: [table, "one", id],
    queryFn: () => (id ? get(table, id) ?? null : null),
    enabled: !!id,
  });
}

function useUpsert<K extends keyof Tables>(table: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rec: Tables[K]) => upsert(table, rec),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
    },
  });
}

function useRemove<K extends keyof Tables>(table: K) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: UUID) => remove(table, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
    },
  });
}

// Active tenant ───────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
export function useActiveTenantId() {
  const [id, setId] = useState<UUID>(() => (typeof window === "undefined" ? "" : getActiveTransportadoraId()));
  useEffect(() => {
    setId(getActiveTransportadoraId());
  }, []);
  return id;
}

// API pública por entidade ─────────────────────────────────────────────────────
export const useTransportadoras = () =>
  useQuery({ queryKey: ["transportadoras"], queryFn: () => list("transportadoras") });
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
export const useSaveViagem = () => useUpsert("viagens");
export const useRemoveViagem = () => useRemove("viagens");

export const useFornecedores = () => useTenantList("fornecedores");
export const useFornecedor = (id: UUID | undefined) => useEntity("fornecedores", id);
export const useSaveFornecedor = () => useUpsert("fornecedores");
export const useRemoveFornecedor = () => useRemove("fornecedores");

export const usePneus = () => useTenantList("pneus");
export const usePneu = (id: UUID | undefined) => useEntity("pneus", id);
export const useSavePneu = () => useUpsert("pneus");
export const useRemovePneu = () => useRemove("pneus");

export const useLancamentos = () => useTenantList("lancamentos");
export const useLancamento = (id: UUID | undefined) => useEntity("lancamentos", id);
export const useSaveLancamento = () => useUpsert("lancamentos");
export const useRemoveLancamento = () => useRemove("lancamentos");

export function nextViagemNumero(transportadora_id: UUID): number {
  const ids = list("viagens")
    .filter((v) => v.transportadora_id === transportadora_id)
    .map((v) => v.numero_viagem || 0);
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

/** Instala um pneu em posição do veículo; libera pneu anterior na mesma posição. */
export function instalarPneu(
  pneuId: UUID,
  veiculoId: UUID,
  posicao: PosicaoPneu,
  hodometro?: number,
): Pneu {
  const pneu = get("pneus", pneuId);
  if (!pneu) throw new Error("Pneu não encontrado");

  const ocupando = list("pneus").find(
    (p) => p.veiculo_id === veiculoId && p.posicao === posicao && p.id !== pneuId,
  );
  if (ocupando) {
    upsert("pneus", {
      ...ocupando,
      veiculo_id: undefined,
      posicao: undefined,
      status: "estoque",
      updated_at: new Date().toISOString(),
    });
  }

  if (pneu.veiculo_id && pneu.posicao) {
    const antigaPos = pneu.posicao;
    const antigoVeiculo = pneu.veiculo_id;
    if (antigoVeiculo !== veiculoId || antigaPos !== posicao) {
      // pneu movido de outro lugar — posição antiga fica vazia
    }
  }

  const now = new Date().toISOString();
  return upsert("pneus", {
    ...pneu,
    veiculo_id: veiculoId,
    posicao,
    status: "instalado",
    hodometro_instalacao: hodometro ?? pneu.hodometro_instalacao,
    updated_at: now,
  });
}

/** Remove pneu do veículo e devolve ao estoque. */
export function desinstalarPneu(pneuId: UUID): Pneu {
  const pneu = get("pneus", pneuId);
  if (!pneu) throw new Error("Pneu não encontrado");
  return upsert("pneus", {
    ...pneu,
    veiculo_id: undefined,
    posicao: undefined,
    status: "estoque",
    updated_at: new Date().toISOString(),
  });
}

export function pneusDoVeiculo(veiculoId: UUID): Pneu[] {
  return list("pneus").filter((p) => p.veiculo_id === veiculoId && p.status === "instalado");
}

export function pneusEmEstoque(transportadoraId: UUID): Pneu[] {
  return list("pneus").filter(
    (p) => p.transportadora_id === transportadoraId && p.status === "estoque",
  );
}

export function useInstalarPneu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pneuId,
      veiculoId,
      posicao,
      hodometro,
    }: {
      pneuId: UUID;
      veiculoId: UUID;
      posicao: PosicaoPneu;
      hodometro?: number;
    }) => instalarPneu(pneuId, veiculoId, posicao, hodometro),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pneus"] }),
  });
}

export function useDesinstalarPneu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pneuId: UUID) => desinstalarPneu(pneuId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pneus"] }),
  });
}
