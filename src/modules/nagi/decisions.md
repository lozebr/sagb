# Decisões do Módulo nagi

Neste arquivo ficam registradas apenas as decisões definitivas sobre o rumo arquitetural e de negócios deste módulo.

## Decisões Iniciais (11/04/2026)
- **Arquitetura Visual**: A NAGIView consome os dados e estrutura do arquivo local data/nagiBlueprint.ts.
- **Governança**: O NAGI atua como a camada de portfólio (topo de funil) do ecossistema, consumindo insumos do CID e NIC.
- **Padrão de Histórico**: Todo histórico de conversa e ideação do NAGI reside em history-chat.md.


## 18/09/2026 — Central de Aplicativos / identidade canônica
**APROVADO pelo pedido operacional do usuário.**

- A seção anteriormente chamada `Links publicados` passa a operar como **Central de Aplicativos**.
- Regra oficial de renderização: `1 produto canônico = 1 card`; URLs não definem identidade de produto.
- `productId` é a identidade canônica; aliases e URLs antigas permanecem preservados como histórico/metadado.
- A tela usa uma grade única, sem separação visual obrigatória por empresa/venture.
- O botão principal só usa Deploy Preview/homologação explicitamente validado.
- Ausência de preview confiável deve resultar em `⚪ NÃO VERIFICADO`, sem substituição silenciosa por produção.
- Produção não é alvo padrão de demonstração.
- O registro local canônico em `data/demoProducts.ts` é a fonte P0; integração dinâmica com GitHub/Netlify/QA permanece evolução futura.
