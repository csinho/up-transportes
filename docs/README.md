# ERP Operacional para Transportadoras

## Visão do produto

Sistema **centrado na viagem**, não em gestão completa de frota. A transportadora cadastra dados de apoio (motoristas, veículos, clientes, produtos/cargas, documentos) para **criar, acompanhar, rastrear e finalizar viagens** em tempo real.

### Fluxo principal

1. Configurar transportadora (`/transportadora`)
2. Cadastrar motoristas, veículos, clientes e produtos/cargas
3. **Criar viagem** (`/viagens`) — vincular motorista, veículo, origem, destino e carga
4. Anexar documentos e gerar PDF da viagem (`/viagens/$id`)
5. Motorista usa o **PWA** (fase atual: planejado) — status, eventos, localização, ocorrências
6. Transportadora acompanha no **rastreamento** (`/rastreamento`) — mapa A→B + posição atual
7. Finalizar viagem — histórico permanece salvo

### Módulos priorizados (versão atual)

| Módulo | Rota | Papel |
|--------|------|--------|
| Dashboard operacional | `/` | Viagens em andamento, atrasadas, ocorrências, docs pendentes |
| **Viagens** | `/viagens`, `/viagens/$id` | **Núcleo do sistema** |
| Rastreamento | `/rastreamento` | Mapa + Realtime (em integração) |
| Motoristas | `/motoristas` | Apoio à viagem |
| Veículos | `/veiculos` | Apoio à viagem |
| Clientes | `/clientes` | Origem/destino |
| Produtos/Cargas | `/produtos` | Carga da viagem |
| Transportadora | `/transportadora` | Configuração e documentos |

### Fase 2 — fora do foco atual

Não priorizar nesta versão:

- Manutenção preventiva, oficina, peças, combustível, multas, IPVA
- Pneus avançados (estoque, fornecedores, drag-and-drop visual)
- Financeiro operacional detalhado

O código de pneus/fornecedores/financeiro pode permanecer no `store` para uso futuro, mas **sem rotas na interface**.

### Próximas entregas técnicas

1. **Rastreamento**: Leaflet + marcadores (origem, destino, posição) + Supabase Realtime
2. **PWA motorista**: mobile-first, offline-first (IndexedDB, Service Worker, fila de sync)
3. **Geolocalização**: API do navegador + histórico de posições por viagem
4. **Supabase**: Auth, RLS por `transportadora_id`, Storage para documentos
5. **Eventos e ocorrências** na entidade viagem (timeline + status)

## Stack

TanStack Start, React 19, Tailwind v4, shadcn/ui, React Query, pdfmake.

## Estrutura de código

- `src/types/` — tipos alinhados ao schema Supabase futuro
- `src/data/store.ts` — hooks React Query → Supabase
- `src/lib/masks.ts`, `src/lib/viacep.ts`, `src/lib/pdf.ts`
- `src/components/AddressForm.tsx`, `DocumentUploader.tsx`
- `src/components/layout/AppSidebar.tsx` — navegação em grupos: Operação / Cadastros de apoio / Configurações
- `src/routes/` — uma rota por módulo

## Multi-tenant

Toda entidade possui `transportadora_id`. O seletor no topbar define o tenant ativo (localStorage). Na migração Supabase: RLS `transportadora_id = current_tenant()`.

## Migração Supabase

### 1. Configurar ambiente

```bash
cp .env.example .env.local
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Settings → API no dashboard)
```

### 2. Aplicar migrations no projeto remoto

**Opção A — CLI (recomendado)**

```bash
npm run supabase:login    # abre o browser
npm run supabase:push     # link + db push (projeto tmjbzmjnqkgjwwkrxuxh)
```

**Opção B — SQL Editor manual**

Se a migration `motorista_auth` ainda não foi aplicada, cole o conteúdo de
`supabase/apply-pending-manual.sql` no [SQL Editor](https://supabase.com/dashboard/project/tmjbzmjnqkgjwwkrxuxh/sql).

Migrations incluídas:

| Arquivo | Conteúdo |
|---------|----------|
| `20260524120000_core_schema.sql` | Tabelas, RLS, bucket `documentos`, Realtime |
| `20260524120100_link_transportadora_rpc.sql` | RPC `link_my_transportadora` |
| `20260524130000_motorista_auth.sql` | Login PWA por CPF, RLS motorista |
| `20260524140000_demo_tenant_storage_motorista.sql` | Tenant inicial + Storage motorista |

### 3. Auth no dashboard

1. Crie um usuário em **Authentication → Users** (login ERP)
2. Ative **Anonymous Sign-ins** em **Authentication → Providers** (PWA `/motorista`)
3. No primeiro login ERP, o app vincula à transportadora `Rodoviário Sul Cargas`

### 4. Storage de documentos

- Bucket privado `documentos` (50 MB por arquivo)
- Path: `{transportadora_id}/{entidade}/{entidade_id}/{timestamp}-{arquivo}`
- `DocumentUploader` faz upload, preview com URL assinada e remoção no Storage

O app **não funciona sem Supabase** — não há dados mock em localStorage.

## Modelo de viagem (evolução)

Cada viagem deve consolidar:

- Motorista, veículo(s), cliente origem/destino, produto/carga
- Documentos, datas previstas/reais, status
- Eventos, ocorrências, histórico de localização (a implementar nos tipos e no store)
