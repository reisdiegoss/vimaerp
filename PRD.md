📦 PRD - Product Requirements Document: VimaERP
===============================================

1. Visão do Produto

O VimaERP é um sistema SaaS de gestão empresarial e PDV focado em pequenos varejistas e prestadores de serviços. O diferencial do produto é entregar recursos antes restritos a "ERPs de grande porte" (gestão de validades, acesso granular RBAC e automações via WhatsApp) em uma interface extremamente fluida (React) e um backend ultra-rápido e não bloqueante (Python).

1. Público-Alvo

* Pequenos mercados, mercearias e padarias.

* Lojas de varejo (roupas, eletrônicos, cosméticos).

* Pequenas farmácias ou distribuidoras (gestão de validades Lotes FIFO/FEFO).

* Prestadores de serviço em geral.

1. Problemas Resolvidos (Dores do Cliente)

2. **Lentidão no Caixa:** Sistemas web que travam aguardando retorno de banco de dados e SEFAZ. _Solução: PDV em React consumindo backend FastAPI assíncrono._

3. **Vazamento de Permissões:** Senhas de Admin circulando. _Solução: Sistema nativo RBAC via tokens JWT assinados._

4. **Perda de Produtos por Validade:** Falta de controle avançado. _Solução: Lógica nativa de Lotes vinculada às vendas._

5. **Desconexão de Ferramentas:** Uso de múltiplos apps simultâneos. _Solução: Integrações nativas com Asaas e Evolution API._

6. Requisitos Funcionais (Core Features)

* **Gestão Multi-Tenant:** Base PostgreSQL unificada com separação lógica estrita nos escopos da aplicação.

* **PDV Omnichannel:** Frente de caixa SPA, com respostas instantâneas, navegação por teclado e busca assíncrona.

* **Motor Fiscal API:** Emissão automatizada de NFC-e/NF-e via Filas (Tasks) rodando em background no Celery.

* **Mensageria Automática:** Envio do "Cupom Verde" e link do Asaas direto pelo WhatsApp do cliente via Evolution API.

* **Financeiro Automatizado:** Geração e conciliação de cobranças e boletos com baixas processadas via Webhook.

1. Requisitos Não Funcionais

* **Disponibilidade:** SLAs em Cloud focados em 99.9%.

* **Desempenho:** Resposta das APIs internas em < 100ms utilizando o Uvicorn/FastAPI.
