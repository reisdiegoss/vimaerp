Goal
----

Garantir que a infraestrutura do VimaERP seja orquestrada com Docker Swarm para alta disponibilidade, escalabilidade do SaaS e segurança dos serviços (PHP, PostgreSQL, Redis).

Instructions
------------

* Utilize a sintaxe moderna compatível com Docker Swarm (focando no uso do bloco deploy, replicas, update\_config e restart\_policy).

* Arquivos destinados à produção devem ser nomeados como docker-stack.yml.

* Configure redes do tipo overlay para garantir comunicação isolada e segura entre os diferentes nós do Swarm.

* Proteja credenciais sensíveis (senhas de banco, tokens de API) utilizando **Docker Secrets**, nunca as deixando expostas em variáveis de ambiente em texto limpo no arquivo.

* Defina healthchecks rigorosos para os containers do PHP, PostgreSQL e Redis, garantindo que o Swarm identifique falhas e reinicie serviços travados automaticamente.

* Restrinja o banco de dados a nós específicos utilizando placement constraints (ex: node.labels.database == true) para evitar perda de referência de volumes.

Constraints
-----------

* DO NOT exponha portas de infraestrutura crítica (como 5432 do PostgreSQL ou 6379 do Redis) diretamente para a internet (host). Elas devem ser acessíveis APENAS internamente pelas redes do Swarm.

* DO NOT crie volumes anónimos para o banco de dados. O PostgreSQL DEVE sempre utilizar volumes nomeados e persistentes.
