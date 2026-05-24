# ERP Transportadoras — Plano da Fase 1

Entrega enxuta e bem feita primeiro. Pneus, rastreamento, PWA do motorista e modo offline ficam para fases seguintes (escopo grande demais para uma só entrega sem ficar raso).

## Escopo desta fase

Incluso:

1. Configuração da Transportadora (dados + endereço via ViaCEP + documentos)
2. Cadastro de Motoristas (+ CNH + documentos)
3. Cadastro de Veículos (+ documentos, máscara de placa antiga/Mercosul)
4. Cadastro de Clientes (PF/PJ + ViaCEP)
5. Cadastro de Produtos/Cargas
6. Viagens (vínculos, status, origem/destino, múltiplos documentos)
7. Geração de PDF profissional da viagem
8. Dashboard com indicadores básicos da operação
9. Camada de dados mockada (in-memory + localStorage) com mesma forma das futuras tabelas Supabase
10. Estrutura multi-tenant preparada (toda entidade carrega `transportadora_id`; "transportadora ativa" simulada via contexto)

Fora desta fase (planejado, mas em entregas futuras):

- Rastreamento em tempo real + mapa Leaflet
- PWA do motorista (login, eventos de viagem, geolocalização)
- Funcionamento offline com IndexedDB + service worker + fila de sincronização
- Módulo de pneus, estoque, fornecedores e drag-and-drop visual
- Financeiro operacional detalhado
- Autenticação real (Supabase Auth) e RLS

## Arquitetura

- TanStack Start + Tailwind + shadcn (stack do template).
- Layout administrativo com sidebar + topbar.
- Rotas separadas para cada módulo (sem hash anchors):
  - `/` → dashboard
  - `/transportadora` → configuração
  - `/motoristas`, `/motoristas/$id`
  - `/veiculos`, `/veiculos/$id`
  - `/clientes`, `/clientes/$id`
  - `/produtos`
  - `/viagens`, `/viagens/$id` (com aba de documentos e botão "Gerar PDF")
- Camada de dados em `src/data/` com um repositório por entidade, exportando hooks (`useMotoristas`, `useViagens`, etc.) baseados em React Query. As implementações usam um store mockado, mas a assinatura é equivalente à futura chamada Supabase, para troca em uma fase posterior sem reescrever as telas.
- Tipos TypeScript em `src/types/` espelhando o schema sugerido no briefing.
- Componentes reutilizáveis: `AddressForm` (ViaCEP), `DocumentUploader` (lista + preview + modal), `EntityTable`, `StatusBadge`, `MaskedInput` (CPF/CNPJ/placa/telefone/CEP).

## Detalhes técnicos por módulo

- **ViaCEP**: hook `useViaCep(cep)` chamando `https://viacep.com.br/ws/{cep}/json/`, com debounce e fallback manual.
- **Upload de documentos (mock)**: arquivos guardados como `URL.createObjectURL` + metadados em memória; preview em miniatura, modal de visualização para imagens e iframe para PDFs. A interface do uploader já recebe um `uploader` injetado para trocar por Supabase Storage depois.
- **Máscara de placa**: aceita `ABC-1234` e `ABC1D23`, normaliza para maiúsculas sem hífen.
- **Viagens**: número gerado sequencialmente por transportadora; endereço de origem/destino pré-preenchido a partir do cliente selecionado, editável.
- **PDF da viagem**: gerado client-side com `@react-pdf/renderer` (instalado nesta fase). Layout com cabeçalho da transportadora (logo, CNPJ, RNTRC, contatos), bloco origem → destino, motorista, veículos, produto, lista de documentos vinculados e rodapé de assinaturas.
- **Dashboard**: cards de viagens por status, motoristas/veículos por status, alertas de CNH/CRLV vencendo (calculados a partir do mock).
- **Multi-tenant mock**: seletor de "Transportadora atual" no topbar; todas as queries filtram por `transportadora_id`. Quando migrar para Supabase, vira filtro via RLS + `auth.uid()`.

## Documentação

Junto com o código vou criar `docs/`:

- `docs/visao-geral.md` — arquitetura, pastas, fluxos principais
- `docs/modelo-dados.md` — tabelas, campos, relacionamentos (espelhando o schema do briefing)
- `docs/integracoes.md` — como trocar mocks por Supabase (Database, Storage, Realtime), como ligar ViaCEP em produção, plano para Auth/RLS
- `docs/roadmap.md` — fases 2 (rastreamento + PWA), 3 (offline) e 4 (pneus + financeiro)

## Por que não fazer tudo agora

Rastreamento realtime, PWA offline-first com IndexedDB e o módulo de pneus com drag-and-drop visual são, cada um, projetos de porte próprio. Tentar entregar tudo de uma vez com mocks resultaria em telas que parecem prontas mas quebram no primeiro uso real. A Fase 1 entrega o núcleo operacional (cadastros → viagem → PDF) de forma sólida e com a fundação certa para as próximas fases plugarem sem retrabalho.

Confirma para eu começar a implementar?

&nbsp;

Preciso que utilize a biblioteca pdfmaker para geração do PDF

&nbsp;

Outra coisa, irei utilizar o Supabase direto pelo script e não pelo lovable cloud