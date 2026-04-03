---
name: vimaerp-redis
description: Ativada para lógicas de controle de estoque, mensageria, filas de background, websockets ou telas de tempo real (como KDS/Cozinha).
---
## Goal

Evitar travamentos no PHP e no PostgreSQL delegando processamento assíncrono e de tempo real para o Redis.

## Instructions

- Use Redis Sorted Sets (ZSETs) para gerenciar lotes e validades de estoque no PDV (PVPS/PEPS).
- Para o KDS (Telas de Cozinha), utilize Redis Pub/Sub integrado com WebSockets para atualizar os pedidos instantaneamente na tela, sem necessidade de polling.
- Jobs pesados (relatórios, integrações SEFAZ) devem ser enfileirados no Redis para processamento via Workers em background.

## Constraints

- DO NOT travar a resposta HTTP do PHP para aguardar integrações externas.
- DO NOT gerenciar concorrência de estoque unicamente no PostgreSQL, a trava atômica inicial deve ocorrer no Redis.
