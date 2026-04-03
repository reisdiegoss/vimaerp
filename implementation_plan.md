# Frontend: Módulo de Autenticação e Hub de Unidades Multi-Aba

Este plano detalha a arquitetura do novo Frontend do VimaERP 2.0 (React + Vite + Tailwind 4 + Zustand + Shadcn/UI) para atender perfeitamente aos requisitos de isolamento Multi-Aba.

> [!IMPORTANT]
> **Revisão Necessária**: Por favor, analise a abordagem de **sessionStorage vs URL Parameters** para o controle da filial ativa, bem como a necessidade de um novo endpoint no backend (`/auth/filiais`).

---

## 🏗️ 1. Setup da Infraestrutura Frontend

Será criado o diretório `/frontend` utilizando as melhores práticas do ecossistema React atual:
- **Build Tool:** Vite + `react-ts`
- **Estilos:** Tailwind CSS v4 + Shadcn/UI (Componentes Radix acessíveis)
- **Roteamento:** React Router Dom v6+
- **Comunicação:** Axios + TanStack Query (React Query)
- **Gerenciamento de Estado:** Zustand

---

## 🔐 2. Fluxo de Autenticação e Roteamento Inteligente

### Passo 1: Login
1. O usuário preenche credenciais em `/login`.
2. O JWT é recebido e salvo estritamente no `localStorage` (via Zustand persist auth).
3. Chamamos o novo endpoint do backend para listar as **Filiais liberadas para o usuário**.

### Passo 2: Decisão de Rota (Hub vs Direto)
- **Se Filiais.length == 1**: Salva o `filial_id` no `sessionStorage` e roteia diretamente para `/app/dashboard`.
- **Se Filiais.length > 1**: Roteia para `/hub`. A tela mostrará cards luxuosos das empresas. Ao clicar em uma, o `filial_id` é gravado no `sessionStorage` e o usuário vai para `/app/dashboard`.

---

## 🗂️ 3. Arquitetura Multi-Aba (O Desafio)

Para permitir que o usuário gerencie a "Empresa A" na Aba 1 e a "Empresa B" na Aba 2 sem vazamento de estado, usaremos **isolamento nativo do navegador**:

1. **Storage Separado**: 
   - `localStorage` > Guarda o JWT (para que, se abrir nova aba, já caia logado).
   - `sessionStorage` > Guarda o `active_filial_id` (pois ele nasce vazio numa nova aba ou herda via clone de aba duplicada, mas opera individualmente a partir dali).
2. **Axios Interceptor (`src/lib/api.ts`)**:
   Antes de cada requisição ir para a API, o axios interceptará a chamada e injetará:
   - `Authorization: Bearer <from_localStorage>`
   - `X-Filial-Id: <from_sessionStorage>`
   Isso garante que chamadas da Aba 1 enviem ID da filial A, e chamadas da Aba 2 enviem ID da filial B.

> [!TIP]
> **Por que sessionStorage e não URL Parameter?**
> A injeção de headers no Axios a partir da URL em componentes React é difícil sem atrelar a lógica de rede aos Hooks de Rota do React. O `sessionStorage` funciona de fora da árvore do React e pode ser acessado em milissegundos pelo interceptor do Axios. É o padrão-ouro de arquitetura de abas!

---

## 🔙 4. Modificações Necessárias no Backend (API)

Para que o frontend possa desenhar o Hub de Unidades e permitir a troca rápida pela Navbar, precisamos que o backend devolva quais filiais o usuário acessa.

### [NEW] Endpoint `/api/v1/auth/filiais` ou modificação em `/api/v1/auth/me`
Precisaremos que a API responda com a lista de filiais e seus dados cadastrais (nome, cnpj, logo_url) associadas ao `user_id` logado (com base no RBAC ou na tabela de relacionamento usuário/filial).

---

## ❓ 5. Perguntas Abertas (Open Questions)

1. Você prefere que eu aprimore o endpoint `/api/v1/auth/login` para já devolver as filiais do usuário no corpo principal do `TokenResponse`, ou que façamos uma chamada separada `GET /api/v1/auth/filiais` (melhor para caching via React Query)?
2. A biblioteca Tailwind será a recém lançada v4. Confirmamos essa stack?
3. Posso inicializar o projeto usando o boilerplate padrão dentro da sub-pasta `/frontend`?

## 🧪 6. Plano de Verificação

1. Criar o frontend via CLI.
2. Construir `lib/api.ts` com validadores de storages.
3. Desenhar a UI de `/login` e `/hub`.
4. Mockar/Ligar o backend e testar o roteamento (Logar e abrir tela A).
5. Duplicar aba do navegador, voltar pro hub, escolher filial B. Validar via Network Tab se os headers da Aba 1 mantiveram o envio do `X-Filial-Id` da aba 1, e aba 2 da filial 2.
