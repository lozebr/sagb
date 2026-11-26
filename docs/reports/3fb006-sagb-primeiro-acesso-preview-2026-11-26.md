# SagB — primeiro acesso em homologação

26/11/2026 — Operação autorizada pelo responsável.

- Netlify `sagbapp`: gravação e leitura de retorno confirmadas para `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no contexto `deploy-preview`, apontando para a incubadora LOZE. Nenhuma chave de serviço foi copiada.
- As entradas de produção permaneceram presentes; nenhuma publicação em produção foi solicitada.
- Este registro dispara novo build do PR de homologação #6, necessário para incorporar as variáveis de build do Vite.
- Gate: confirmar novo deploy e testar tela de primeiro acesso, entrega de e-mail e admissão real. Não considerar o acesso concluído antes do teste.
