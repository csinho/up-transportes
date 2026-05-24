# ERP Transportadoras — Plano (operação de viagens)

## Posicionamento

**ERP operacional focado em viagem**, não em gestão completa de frota. Cadastros existem para suportar o ciclo: criar → rastrear → finalizar viagens.

## Versão atual (foco)

- Dashboard operacional (viagens em andamento, planejadas, atrasadas, alertas)
- **Viagens** como módulo principal (CRUD, documentos, PDF)
- **Rastreamento** — Leaflet, mapa overview, Supabase Realtime
- **PWA motorista** — `/motorista`, ocorrências, fila offline, login CPF + Supabase
- Cadastros de apoio: motoristas, veículos, clientes, produtos, transportadora
- **Dados 100% Supabase** — sem mock/localStorage de cadastros

## Próximas entregas (ordem sugerida)

1. ~~Tipos e store: `ViagemEvento`, `ViagemOcorrencia`, `ViagemLocalizacao`~~
2. ~~Rastreamento: Leaflet + overview + Realtime~~
3. ~~PWA motorista: `/motorista`, fila offline, Service Worker, instalar na tela inicial~~
4. ~~Supabase Auth + RLS + Storage~~ — ERP e PWA só Supabase; documentos no bucket `documentos`

## Fase 2 (fora do escopo atual)

- Pneus (estoque, instalação visual, fornecedores)
- Financeiro detalhado
- Manutenção, combustível, multas, IPVA, oficina

## Arquitetura de rotas

| Grupo | Rotas |
|-------|--------|
| Operação | `/`, `/viagens`, `/viagens/$id`, `/rastreamento` |
| Cadastros de apoio | `/motoristas`, `/veiculos`, `/clientes`, `/produtos` |
| Configurações | `/transportadora` |

## Stack

TanStack Start + Tailwind + shadcn + React Query + pdfmake + Supabase (Auth, Postgres, Storage, Realtime).
