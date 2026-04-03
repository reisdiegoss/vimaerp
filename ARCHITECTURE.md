🏛️ Arquitetura do VimaERP (Python/React Edition)
=================================================

Este documento descreve as decisões de arquitetura de software adotadas no VimaERP 2.0. O sistema agora é desacoplado, utilizando **Python (FastAPI)** no backend e **React** no frontend, focando em performance assíncrona, código limpo e arquitetura MVCS.

1\. Padrão Arquitetural: MVCS (Active Record Style)
---------------------------------------------------

Para maximizar a produtividade e manter o código limpo no FastAPI, adotamos o padrão **MVCS (Model-View-Controller-Service)** combinado com o **Active Record**:

* **Models (Active Record):** A estrela da aplicação. Estendem uma classe base (ActiveRecordMixin) sobre o SQLAlchemy 2.0. O Model sabe como se salvar, buscar e deletar (ex: await Produto.find(id) ou await produto.save()).

* **Views (React):** O frontend SPA moderno que consome nossa API RESTful.

* **Controllers (FastAPI Routers):** Camada muito fina. Rotas (Endpoints) que recebem requisições, validam dados usando Pydantic, e repassam para os Models ou Services.

* **Services (Business Logic):** Reservados para processos de negócios complexos que envolvem múltiplos Models ou chamadas de integrações (ex: VendaService, FiscalService, AsaasService).

2\. Isolamento Multi-Tenant (SaaS)
----------------------------------

O VimaERP utiliza um **Single Database** (PostgreSQL). O isolamento de dados é garantido na camada de banco de dados e aplicação:

* **Identificação:** Todas as tabelas transacionais e de cadastro possuem as colunas tenant\_id e filial\_id.

* **Middleware de Contexto:** Um middleware/dependência no FastAPI intercepta o token JWT e os headers (ex: X-Filial-Id), injetando o contexto do Tenant atual através de contextvars do Python. O ActiveRecordMixin anexa automaticamente esses IDs às queries.

3\. Validação e Tipagem
-----------------------

* O backend utiliza **Pydantic** para validação de payload HTTP, gerando documentação Swagger/OpenAPI nativa e eliminando dados malformados antes de tocarem no Controller.

* O frontend utiliza **TypeScript**, **Zod** e **React Hook Form** para validações no lado do cliente.

4\. Transações e Precisão Financeira
------------------------------------

* **DB Transactions:** Qualquer operação multi-tabela (Ex: Fechar Venda) é executada dentro de um bloco transacional assíncrono (async with session.begin():).

* **Dinheiro:** Utiliza-se a tipagem estrita Decimal do Python ou Integer (centavos) para evitar os clássicos bugs de ponto flutuante no PostgreSQL (NUMERIC).

5\. Assincronismo e Filas (Celery + Redis)
------------------------------------------

O FastAPI já é assíncrono nativo (I/O non-blocking), mas tarefas pesadas não devem prender a resposta da API:

* Emissão de NFe/NFCe, Envio de Webhooks, Geração de Boletos e disparos no WhatsApp são enviados para uma fila gerenciada pelo **Celery** com **Redis** como broker.

* O frontend recebe respostas rápidas (ex: HTTP 202 Accepted) e acompanha a conclusão das tarefas via polling ou WebSockets.

6\. Frontend e UI
-----------------

* **React 18 + Vite:** SPA de carregamento ultra-rápido.

* **Componentização:** Utilização de **Shadcn/UI** para componentes acessíveis e modulares, estilizados com **Tailwind CSS**.

* **State Management:** **TanStack Query (React Query)** gerencia o cache e o fetch da API, enquanto o **Zustand** mantém pequenos estados globais (como carrinho do PDV ou usuário logado).
