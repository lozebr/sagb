# Changelog

## 0.1.0 — 26/11/2026
Catálogo 20 oficiais, 6 candidatos separados. MVP em branch isolada, sem DB ou homologação nova.

## 0.1.1 (interface de demonstração) — 26/11/2026
Entrada estática isolada no Preview #9, sem dependência de Auth/Supabase. O catálogo e os Cores continuam v0.1.1; operação normal segue protegida.

## 0.2.0 — 26/11/2026
Redesign integral: identidade LOZE, hero, indicadores clicáveis, progresso real, cartões compactos com ícones e status semânticos, busca e filtros, detalhes com gates, laboratórios com configuração e resultado separados, responsividade e acessibilidade. Nenhuma alteração dos cores, dados, Auth ou homologação.

## 0.2.1 — integração plugável
App, Sidebar e Configurações compartilham estado de ativação pelo workspace ativo; gravação de override pontual e evento comum, sem copiar defaults. Desativação oculta menu e impede renderização nativa. Preferências locais, não autorização. Preview isolado permanece disponível para QA.
