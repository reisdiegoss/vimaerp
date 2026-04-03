🛤️ Roadmap Oficial - VimaERP 2.0 (Python/React)
================================================

O desenvolvimento será executado de forma modular. O backend fornecerá endpoints para o frontend React gradualmente.

🟢 SPRINT 1: Fundação FastAPI, Active Record e React (Dias 1 - 5)
-----------------------------------------------------------------

* \[ \] Backend: Inicialização do FastAPI e configuração do Uvicorn.

* \[ \] Backend: Criação do ActiveRecordMixin base sobre o SQLAlchemy.

* \[ \] Backend: JWT Auth (OAuth2), Schema de Usuários e Middleware de Tenant.

* \[ \] Frontend: Setup do Vite + React + Tailwind + Shadcn/UI.

* \[ \] Frontend: Integração do Axios, TanStack Query e telas de Login.

🟡 SPRINT 2: Gestão Operacional e Cadastros (Dias 6 - 12)
---------------------------------------------------------

* \[ \] Backend: Endpoints MVCS (Controllers chamando Models.save()) para Produtos, Categorias e Pessoas.

* \[ \] Frontend: Telas de listagem, formulários complexos (React Hook Form + Zod) e modais.

* \[ \] Backend: Módulo de Estoque e rastreamento de Lotes/Validade.

🟠 SPRINT 3: O PDV Resiliente (Dias 13 - 18)
--------------------------------------------

* \[ \] Frontend: Interface do PDV focada em atalhos de teclado (Hotkeys).

* \[ \] Frontend: Carrinho e cálculos locais usando Zustand e IndexedDB.

* \[ \] Backend: Endpoint POST /api/pdv/fechar, implementando Transações de DB (DB Transactions) para abater estoque e registrar financeiro.

🔴 SPRINT 4: Celery, Filas e Fronteira Fiscal (Dias 19 - 24)
------------------------------------------------------------

* \[ \] Backend: Setup do Redis e Celery para task jobs em background.

* \[ \] Backend: Integração Fiscal. Criação do FiscalService para montar payload e submeter para API de emissão de NF-e/NFC-e.

* \[ \] Backend: Celery Task emitir\_nota\_fiscal\_task para evitar timeouts no endpoint do PDV.

🟣 SPRINT 5: Ecossistema Asaas e Evolution API (Dias 25 - 30)
-------------------------------------------------------------

* \[ \] Backend: Integração com Asaas via httpx. Controllers para receber webhooks no FastAPI (com assinatura verificada).

* \[ \] Backend: Mensageria via Celery (enviar\_whatsapp\_task) conectando ao Websocket/HTTP da Evolution API.

* \[ \] Frontend: Dashboards analíticos (Gráficos) com consumo em tempo real.
