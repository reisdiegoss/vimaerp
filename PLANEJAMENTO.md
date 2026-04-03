🗺️ Planejamento e Escopo de Módulos (VimaERP 2.0)
==================================================

O VimaERP 2.0 adota uma arquitetura desacoplada (API Backend e SPA Frontend). O desenvolvimento deve seguir a ordem estrita abaixo.

Fase 1: Fundação Core (APIs e UI Base)
--------------------------------------

O motor estrutural do sistema.

* **Database & ORM:** Configuração do PostgreSQL, Alembic (migrações) e da classe base ActiveRecordMixin (SQLAlchemy).

* **Auth & Tenant:** Autenticação via JWT (OAuth2 Password Bearer), extração de tenant\_id via ContextVars.

* **RBAC (Controle de Acesso):** Modelagem de permissões na API FastAPI. Perfil Dono, Gerente e Caixa.

* **UI Foundation:** Setup do React (Vite), Shadcn/UI, roteamento (React Router) e TanStack Query.

Fase 2: Cadastros e Gestão Base
-------------------------------

O motor que alimenta a operação diária.

* **Filiais:** Estruturação multi-loja.

* **Produtos & Categorias:** CRUD (via Active Record) de itens, precificação e dados fiscais.

* **Pessoas:** Gestão de Clientes, Fornecedores e Funcionários.

* **Estoque & Lotes:** Entradas/Saídas e controle avançado de validade e lotes.

Fase 3: Operação e Vendas (PDV UI/UX)
-------------------------------------

A "Frente de Loja" de alta resiliência.

* **PDV React:** Interface ágil, otimizada para teclado e leitor de código de barras.

* **Offline-First Parcial:** Manutenção do carrinho no Zustand/IndexedDB.

* **Fechamento:** Submissão dos dados para o endpoint POST /vendas, disparando as baixas de estoque via DB Transactions no backend.

Fase 4: Motor Fiscal e Filas
----------------------------

A legalização e processamento assíncrono.

* **Celery & Redis:** Configuração da task queue do Python.

* **Emissão Fiscal:** Integração via API REST (ex: FocusNFe / Webmania) ou lib Python especializada para emissão de NFC-e (consumidor) e NF-e (B2B).

* **Background Jobs:** Geração do XML e transmissão ocorrendo fora da requisição HTTP do PDV.

Fase 5: Integrações Externas (O Diferencial SaaS)
-------------------------------------------------

Conexão do ERP com o mundo.

* **Gateways Financeiros:** Integração (via pacote httpx assíncrono) com **Asaas** e Mercado Pago. Implementação das rotas /webhooks no FastAPI.

* **Mensageria Omnichannel:** Integração com Evolution API via HTTP/Websockets para emissão de cobranças e "Cupom Verde".
