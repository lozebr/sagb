# Changelog

## 26/11/2026 — preparação
- Snapshot oficial IAM 0.1.1, proveniência, adapter e testes de admissão.
- Sem ativação operacional ou mudança de banco.

## 26/11/2026 — entrada candidata
- Bootstrap isolado, SDK e sessão por projeto, login/logout/recuperação PKCE, admissão IAM e allowlist de rede, testes de contrato. Não habilitado remotamente.

## 26/11/2026 — primeiro acesso controlado
- Interface de criação por link/OTP de e-mail, claim IAM sem argumentos, definição de senha após admissão; configuração dedicada de Preview. SQL de revisão e QA negativo transacional. Instalação persistente a confirmar.

## 27/11/2026 — administração de acesso candidata
- Role administrativa SagB, bootstrap individual após confirmação, AAL2, autorização/cancelamento/revogação limitada, trilha, UI e testes de allowlist. SQL negativo/rollback verificados; instalação e QA autenticado pendentes.

## 27/11/2026 — correção pós primeiro acesso real
- Revalidação periódica/visibilidade/refresh de token passa a ser silenciosa quando já admitido: o painel administrativo não é mais desmontado (estado perdido) após "Verificar minhas permissões". Negação ou logout continuam substituindo a tela imediatamente.
- Botões de sessão e MFA com estilo visível. Sem mudança de banco, Auth ou allowlist de rede.
- MFA: nome único por tentativa de cadastro TOTP (fator não verificado abandonado não bloqueia nova tentativa, 422 observado) e mensagens claras para falha de cadastro/código.
- Administração: recusa do servidor (ok=false) mantém a lista e explica o motivo (ex.: e-mail já admitido/administrador), em vez de mensagem genérica.
