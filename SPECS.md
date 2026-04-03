🛠️ Technical Specifications (SPECS) - VimaERP 2.0
==================================================

Este documento detalha as especificações técnicas, bibliotecas e padrões exigidos para o ecossistema Python + React do VimaERP.

1. Stack Tecnológico Base

* **Backend:** Python 3.12+ / FastAPI

* **Frontend:** React 18 / TypeScript / Vite

* **ORM e Banco:** SQLAlchemy 2.0 / PostgreSQL 15+ / Alembic (Migrações)

* **Fila e Background:** Celery / Redis

* **Estilização Frontend:** Tailwind CSS v3 / Shadcn UI / Lucide Icons

1. Padrões de Arquitetura (Backend FastAPI)

* **Active Record Abstraction:** Todas as models do banco estenderão uma classe BaseActiveRecord própria, evitando o excesso de boilerplate típico do Repository Pattern em Python.

* **MVCS:**

  * **Controllers (Routes):** Contêm apenas injeção de dependência e validação.

  * **Schemas (Pydantic):** Fazem o trabalho dos antigos "FormRequests" do PHP, validando input HTTP.

  * **Services:** Focam apenas em casos de uso complexos (FechamentoCaixaService).

* **Isolamento Multi-Tenant:**

  * ContextVars injetam o tenant\_id logado em toda a árvore assíncrona da requisição.

  * As funções do Active Record (ex: Produto.find\_all()) devem ler essa ContextVar e injetar WHERE tenant\_id = ? implicitamente.

1. Padrões de Frontend (React)

* **Gerenciamento de Estado do Servidor:** Proibido uso abusivo de useEffect para fetches. Utilização estrita do @tanstack/react-query para cacheamento, retry e revalidação no foco da aba.

* **Gerenciamento de Estado Local:** Utilizar Zustand para carrinhos de compra, temas ou menus (sem Redux).

* **Validação de Forms:** Utilizar react-hook-form acoplado ao zod e integrado com a tipagem das rotas geradas pelo backend.

1. Especificações Fiscais

* Dado o ecossistema Python, o Motor Fiscal usará comunicação REST com APIs modernas autorizadas (Focus NFe, Webmania) ou biblioteca especializada em Python (pysped/python-nfe) embutida na nossa task assíncrona.

* A comunicação SEFAZ deve sempre rodar nos workers do Celery para jamais comprometer o tempo de resposta do Request HTTP do cliente.

1. Prevenção de Falhas Críticas

* **Dinheiro:** No backend Python, dados financeiros recebidos do ORM serão convertidos para decimal.Decimal antes de qualquer soma ou multiplicação. No Postgres, serão armazenados como NUMERIC(15,2) ou INTEGER absoluto (centavos).

* **Transações:** Alterações múltiplas deverão usar o motor do SQLAlchemy:async with session.begin(): (O commit ou rollback ocorrerá automaticamente na finalização do escopo do context manager).

* **Concorrência:** O Celery Worker deverá ser configurado para tratar falhas da Evolution API e Asaas com _Exponential Backoff_.
