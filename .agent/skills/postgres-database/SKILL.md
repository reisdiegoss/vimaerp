---
name: vimaerp-postgres
description: Ativada quando o usuário pede a criação de tabelas, migrações de banco de dados, queries complexas ou modelagem de dados.
---
## Goal

Manter o isolamento rigoroso dos dados do SaaS (Multi-tenant) e a consistência das chaves através de políticas do PostgreSQL.

## Instructions

- Toda tabela deve possuir campos de auditoria temporais: `created_at` e `updated_at`.
- Toda tabela de negócio precisa possuir as colunas `tenant_id` (separação de clientes) e `filial_id` (separação de lojas).
- Todo índice criado ou chave única (UNIQUE constraint) deve ser composto e liderado pelo `tenant_id`.

## Constraints

- DO NOT use colunas inteiras seriais como Primary Key para tabelas de negócio (vendas, clientes, produtos). OBRIGATORIAMENTE use `UUID` como chave primária para elas. Serials só são permitidos em tabelas de status.
- DO NOT faça queries que ignorem as colunas `tenant_id` e `filial_id`. Confie na abstração do RLS (Row-Level Security).
