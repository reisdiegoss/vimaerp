---
name: vimaerp-python-backend
description: Ativada quando o usuário solicita a criação ou edição de classes, models, controllers ou lógicas de backend em Python.
---
## Goal

Garantir que todo o código backend Python siga o padrão arquitetural MVCS definido para o VimaERP, focado em Active Record Assíncrono e alta performance.

## Instructions

- Organize todo o código usando diretórios e módulos limpos e semânticos (ex: `app/api/v1/`, `app/models/`, `app/services/`).
- As rotas (Controllers) devem ser magras, utilizando `APIRouter` do FastAPI, resolvendo e validando requisições (via Pydantic) antes de chamar a regra de negócio.
- Toda classe Model deve obrigatoriamente estender `BaseActiveRecord` (nossa camada de abstração do SQLAlchemy).
- Em tabelas de domínio estático (status), mapeie os IDs seriais como `IntEnum` ou constantes diretamente na classe Model (ex: `STATUS_VENCIDO = 3`) e use-as no código.

## Constraints

- DO NOT use comandos SQL brutos (`SELECT * FROM`, `INSERT`, `UPDATE`) ou sintaxes verbosas de query diretamente nos controllers. Utilize estritamente os métodos assíncronos nativos do nosso Active Record: `await Model.find()`, `await obj.save()` e `await obj.delete()`.
- NUNCA bloqueie o Event Loop do FastAPI. Todas as operações de banco de dados e regras de negócio devem rodar de forma não-bloqueante utilizando `async` e `await`.
