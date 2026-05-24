# ERP Transportadoras — Documentação

## Visão geral
ERP para transportadoras com cadastros, viagens com documentos e geração de PDF da viagem. Stack: TanStack Start, React 19, Tailwind v4, shadcn/ui, React Query, pdfmake.

## Estrutura
- `src/types/` — tipos espelhando o schema sugerido para Supabase
- `src/data/store.ts` — store mockado (localStorage) com hooks compatíveis com futura migração para Supabase
- `src/lib/masks.ts` — máscaras CPF/CNPJ/CEP/telefone/placa (aceita Mercosul)
- `src/lib/viacep.ts` — integração ViaCEP
- `src/lib/pdf.ts` — geração do PDF da viagem (pdfmake)
- `src/components/AddressForm.tsx` — endereço com preenchimento automático por CEP
- `src/components/DocumentUploader.tsx` — upload + preview + modal de visualização
- `src/components/layout/AppSidebar.tsx` — navegação lateral
- `src/routes/` — rotas (uma por módulo)

## Multi-tenant
Toda entidade carrega `transportadora_id`. O topbar tem um seletor de transportadora ativa, persistido em `localStorage`. Os hooks (`useMotoristas` etc.) já filtram pelo tenant ativo, o que mapeia diretamente para uma política RLS `transportadora_id = current_user_tenant()` no Supabase.

## Fluxos principais
1. **Configurar transportadora** em `/transportadora` — dados, endereço (ViaCEP), documentos.
2. **Cadastrar motoristas, veículos, clientes, produtos**.
3. **Criar viagem** em `/viagens` — vincula motorista, veículos, cliente origem/destino (preenche endereços automaticamente), produto.
4. **Detalhe da viagem** (`/viagens/$id`) — anexar documentos fiscais (NF-e, CT-e, MDF-e, DANFE etc.) e gerar PDF profissional.

## Migração para Supabase
A camada de dados (`src/data/store.ts`) expõe hooks com a mesma assinatura que terão as chamadas Supabase. Para migrar:
1. Substituir `list/get/upsert/remove` por `supabase.from('tabela').select/insert/update/delete`
2. Trocar `arquivo_url` (object URL) por upload em Supabase Storage e usar a URL pública/assinada
3. Substituir `useActiveTenantId` por `auth.uid()` → resolver tenant via tabela `user_tenants`
4. Ativar RLS em todas as tabelas filtrando por `transportadora_id`
5. (Opcional) Mover endereço/documentos da viagem para tabelas relacionadas (`viagem_documentos`) — os tipos já preveem isso

## Próximas fases
- **Fase 2**: PWA do motorista + rastreamento realtime (Supabase Realtime + Leaflet)
- **Fase 3**: Offline-first com IndexedDB + service worker + fila de sincronização
- **Fase 4**: Pneus (estoque, fornecedores, drag-and-drop visual de instalação) + financeiro detalhado
- **Fase 5**: Autenticação (Supabase Auth + roles via `user_roles`)
