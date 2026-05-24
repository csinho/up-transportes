# ERP Transportadoras — Plano (operação de viagens)

## Posicionamento

**ERP operacional focado em viagem**, não em gestão completa de frota. Cadastros existem para suportar o ciclo: criar → rastrear → finalizar viagens.

**Modelo SaaS multi-tenant:** cada transportadora é um tenant isolado. O **dono da plataforma** (você) gerencia tenants, status e assinaturas em área separada do ERP operacional.

---

## Versão atual (entregue / em uso)

- Dashboard operacional (viagens em andamento, planejadas, atrasadas, alertas)
- **Viagens** como módulo principal (CRUD, documentos, PDF, link cliente)
- **Rastreamento** — Leaflet, mapa overview, Supabase Realtime
- **PWA motorista** — `/motorista`, ocorrências, fila offline, login CPF + Supabase
- Cadastros de apoio: motoristas, veículos, clientes, produtos
5, transportadora
- **Colaboradores ERP** — owner / operador, convites, primeiro acesso
- **Portal cliente** — `/acompanhar/{token}` (uma viagem, Realtime, sem login ERP)
- **Auditoria** — eventos/ocorrências + export CSV/PDF (só owner)
- **Dados 100% Supabase** — sem mock/localStorage de cadastros

### Perfis hoje

| Perfil | Escopo |
|--------|--------|
| **Owner (transportadora)** | ERP completo + colaboradores + auditoria + config |
| **Operador** | Operação diária (viagens, cadastros, rastreamento) — sem auditoria/config/colaboradores |
| **Cliente externo** | Só link da viagem (`/acompanhar/{token}`) |
| **Motorista** | PWA `/motorista` |
| **Dono da plataforma** | ❌ *Ainda não existe — próxima grande entrega* |

---

## Fase 3 — Console da plataforma (super-admin)

> **Objetivo:** você, como dono do sistema, criar e gerenciar transportadoras sem depender de SQL manual ou tenant demo fixo.

### 3.1 — Escopo funcional

#### Tela: listagem de transportadoras (`/admin` ou `/plataforma/transportadoras`)

- Listar todas as transportadoras (nome, CNPJ, status, plano, datas)
- Filtros: ativa/inativa, plano, vencimento próximo, busca por nome/CNPJ
- Métricas rápidas por tenant: viagens no mês, motoristas ativos, último acesso
- Ações: ver detalhe, ativar/inativar, ir para “como owner” (impersonate — opcional fase 2)

#### Tela: criar transportadora (`/plataforma/transportadoras/nova`)

- Dados cadastrais: nome fantasia, razão social, CNPJ, contato
- **Owner inicial:** e-mail do primeiro proprietário (convite automático ou vínculo se já existir conta)
- Status inicial: `ativa` ou `trial`
- Plano inicial (placeholder até Stripe): `trial` | `basico` | `profissional`

#### Tela: detalhe da transportadora (`/plataforma/transportadoras/$id`)

Abas sugeridas:

| Aba | Conteúdo |
|-----|----------|
| **Resumo** | Status, plano, datas, logo, owner, contagem de usuários/viagens |
| **Assinatura** | Plano, status pagamento, próximo vencimento, histórico (fase 4) |
| **Usuários** | Colaboradores vinculados (somente leitura ou gestão limitada) |
| **Operação** | Viagens recentes, uso do mês (somente leitura) |
| **Auditoria plataforma** | Log de ações do super-admin neste tenant |

#### Ações críticas (sempre com confirmação)

- **Ativar / Inativar transportadora** — inativa bloqueia login ERP e PWA motorista daquele tenant
- **Suspender por inadimplência** — mesma mecânica, motivo registrado
- **Alterar plano manualmente** — até Stripe estar pronto
- **Remover transportadora** — confirmação forte (digitar CNPJ ou slug), soft-delete preferível

### 3.2 — Modelo de dados (migrations futuras)

```text
platform_admins          -- user_id dos super-admins (você + equipe futura)
transportadoras          -- + colunas: ativa, slug, plano_id, suspenso_em, motivo_suspensao
transportadora_assinaturas  -- fase 4 (Stripe)
transportadora_assinatura_eventos  -- webhooks / histórico
platform_audit_log       -- ações do super-admin
```

**Campos novos em `transportadoras` (mínimo fase 3a):**

- `ativa boolean default true`
- `plano text default 'trial'` — enum até tabela de planos
- `trial_ate timestamptz`
- `criado_por uuid` — platform_admin que provisionou

**RLS:**

- Tenants normais: inalterado (`user_transportadora_ids()`)
- Platform admin: policies extras `using (is_platform_admin())` em `transportadoras` e leitura agregada
- RPCs `security definer` para criar tenant + owner em transação única

### 3.3 — Rotas e UI

| Grupo | Rotas |
|-------|--------|
| **Plataforma** | `/plataforma`, `/plataforma/transportadoras`, `/plataforma/transportadoras/nova`, `/plataforma/transportadoras/$id` |
| Operação (tenant) | `/`, `/viagens`, `/rastreamento`, … *(inalterado)* |
| Público | `/login`, `/motorista`, `/acompanhar/$token` |

- Layout **sem sidebar do ERP** — sidebar própria da plataforma
- Acesso guard: `PlatformAuthGate` — só `platform_admins`
- Dono da plataforma **não** usa `TenantSwitcher`; vê todos os tenants na listagem

### 3.4 — Entregas incrementais

| Entrega | Conteúdo | Depende de |
|---------|----------|------------|
| **3a** | Migration `platform_admins` + `transportadoras.ativa` + RPC criar tenant | — |
| **3b** | UI listagem + criar transportadora + ativar/inativar | 3a |
| **3c** | Detalhe tenant (resumo, usuários, operação read-only) | 3b |
| **3d** | Bloqueio de acesso quando `ativa = false` (ERP + motorista) | 3a |
| **3e** | Audit log plataforma | 3b |

---

## Fase 4 — Assinaturas por transportadora (Stripe)

> **Planejado.** Integração de billing SaaS: cada transportadora paga mensalidade conforme plano.

### 4.1 — Planos sugeridos (rascunho)

| Plano | Limites (exemplo) | Preço |
|-------|-------------------|-------|
| **Trial** | 14 dias, 1 motorista, 10 viagens/mês | Grátis |
| **Básico** | até 5 motoristas, viagens ilimitadas | R$/mês |
| **Profissional** | motoristas ilimitados, auditoria, links cliente | R$/mês |

Limites aplicados via middleware/RPC (`tenant_pode_criar_viagem`, etc.).

### 4.2 — Fluxo Stripe (alto nível)

1. Owner da transportadora acessa **Config → Assinatura** (dentro do ERP tenant)
2. Checkout Session Stripe → cartão / boleto / PIX
3. Webhook `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated/deleted`
4. Atualiza `transportadora_assinaturas` + `transportadoras.ativa` / `plano`
5. Inadimplência → `ativa = false` ou grace period configurável
6. Console plataforma mostra status sincronizado + link para Customer Portal Stripe

### 4.3 — Tabelas assinatura

```text
planos                    -- id, nome, stripe_price_id, limites jsonb
transportadora_assinaturas
  - transportadora_id
  - stripe_customer_id
  - stripe_subscription_id
  - plano_id
  - status (trialing, active, past_due, canceled, …)
  - current_period_end
transportadora_assinatura_eventos  -- payload webhook, processed_at
```

### 4.4 — Entregas assinatura

| Entrega | Conteúdo |
|---------|----------|
| **4a** | Tabelas + seed planos + Stripe products/prices (test mode) |
| **4b** | Checkout + Customer Portal (owner tenant) |
| **4c** | Webhooks + sync status |
| **4d** | Enforcement de limites por plano |
| **4e** | UI assinatura no console plataforma + alertas vencimento |

**Skills/refs:** Stripe Checkout Sessions, Customer Portal, webhooks; restricted keys; nunca expor secret no frontend.

---

## Arquitetura de rotas (consolidada)

| Grupo | Rotas | Quem acessa |
|-------|--------|-------------|
| **Plataforma** | `/plataforma/*` | Dono da plataforma |
| Operação | `/`, `/viagens`, `/rastreamento`, `/auditoria` | Owner / Operador |
| Cadastros | `/motoristas`, `/veiculos`, `/clientes`, `/produtos` | Owner / Operador |
| Config tenant | `/transportadora` | Owner |
| Público | `/login`, `/motorista`, `/acompanhar/$token` | Todos / anon |

---

## Ordem de prioridade (roadmap)

1. ~~ERP operacional + Realtime + PWA motorista~~ ✅
2. ~~Colaboradores, permissões, portal cliente~~ ✅
3. ~~Console plataforma (3a → 3b)~~ ✅ — listar, criar, detalhe, ativar/inativar
4. **Assinaturas Stripe (4a → 4e)** ← *próximo*
5. Fase 2 produto (pneus, financeiro detalhado) — depois do SaaS estável

---

## Stack

TanStack Start + Tailwind + shadcn + React Query + pdfmake + Supabase (Auth, Postgres, Storage, Realtime) + **Stripe** (fase 4).
