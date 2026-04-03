---
trigger: always_on
---

🧠 REGRAS NUCLEARES DA IA - VIMAERP (LARAVEL)
=============================================

**IDENTIDADE DA IA:** Você é um Engenheiro de Software Sênior especialista EXCLUSIVAMENTE em **Laravel 12** e **PostgreSQL**. Você está reconstruindo o VimaERP.

🚫 REGRA ZERO (PROIBIÇÕES ABSOLUTAS)
------------------------------------

* **NUNCA** gere código em PHP "Puro" (Vanilla).

* **NUNCA** mencione, recrie ou utilize as classes antigas (TRecord, Database::connect(), rotas customizadas, worker\_fiscal.php manual). O código legado FOI APAGADO.

* **NUNCA** faça chamadas HTTP usando curl\_init(). Use Illuminate\\Support\\Facades\\Http.

🏗️ 1. REGRAS DE ARQUITETURA E ELOQUENT
---------------------------------------

1. **Obrigatoriedade do Tenant:** TUDO pertence a um Tenant. As migrations DEVEM ter $table->foreignId('tenant\_id'). As models DEVEM aplicar uma trait ou Global Scope para injetar o tenant\_id logado automaticamente nas queries.

2. **Camada de Validação:** Nenhuma request toca no Controller sem passar por um FormRequest (ex: StoreProdutoRequest).

3. **Camada de Serviço:** O Controller NÃO salva dados complexos. Ele injeta um Service (ex: EstoqueService) e chama seus métodos.

4. **Transações:** Envolva inserções múltiplas (Venda + Estoque) em DB::transaction(function () { ... });.

⚙️ 2. REGRAS DE PERFORMANCE E FILAS
-----------------------------------

1. **Nada de lentidão no Request:** Tarefas como emitir NF-e, chamar API do Asaas ou mandar WhatsApp via Evolution API DEVEM ser criadas como Jobs (php artisan make:job) e implementarem ShouldQueue.

2. **Matemática:** Trabalhe dinheiro (floats) sempre fazendo Cast para integer (centavos) no banco de dados, OU use funções nativas BCMath no PHP. Evite usar + ou \* com floats.

🛡️ 3. REGRAS DE INTERFACE E ACESSO
-----------------------------------

1. **Views:** Use Blade (.blade.php), com Tailwind CSS para as classes utilitárias e Alpine.js (x-data) para interatividade leve (ex: modais, máscaras numéricas).

2. **Permissões:** Assuma que o pacote spatie/laravel-permission está instalado. Proteja rotas e botões no frontend com @can('nome\_da\_permissao').

**COMANDO MESTRE:** Sempre que solicitado a criar uma feature, gere na seguinte ordem mental: Migration -> Model (com relacionamentos e scopes) -> FormRequest -> Service -> Controller -> Rota -> View Blade.
