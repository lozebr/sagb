# Biblioteca de Módulos LOZE — v0.1.0

MVP em branch isolada. Fonte canônica lozebr/loze-adm; vendor/SOURCE.json registra o SHA e cada blob. Copiados somente cores e presets, sem modificações. Atualizar com SHA autorizado, revisar diff e rodar testes. Não editar vendor diretamente.

Catálogo 20 oficiais e 6 candidatos; demos locais Registry e IAM. Não são piloto integrado, Auth real, persistência ou homologação. Rollback: reverter PR/commit do consumidor; nenhum dado criado. Hub #74 segue gate para Supabase e pilotos.

Projeto ChatGPT proposto pela Direção: um chat por Core, chat central Fábrica para inventário e gates. Registrar decisões e pins no Registro Vivo; chats não substituem GitHub. Organização do projeto/chats pela interface do usuário.


### Entrada de demonstração isolada
No PR auxiliar #9, o build Netlify gera `/biblioteca-preview/index.html` com o mesmo componente LibraryPage, sem importar App, ThemeProvider, Supabase, sessão ou dados operacionais. Não altera login do SagB. A página de demo não é protegida por login e deve conter somente catálogo e fixtures sintéticos. noindex não é controle de acesso. O build de produção e demais previews removem a saída isolada. Não armazenar dados pessoais ou credenciais; não incluir recursos operacionais nesta entrada.
