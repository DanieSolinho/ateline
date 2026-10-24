# Ateline · e-commerce de bolos cenográficos

Loja online da **Ateline Ateliê** ([@atelineatelie](https://www.instagram.com/atelineatelie)), um ateliê de bolos cenográficos na Praça Seca, Rio de Janeiro. Pelo site, a cliente **aluga** um bolo do acervo pela data da festa, **compra** um bolo para ficar com ela ou **encomenda** um bolo novo do jeito dela.

🔗 **Site no ar:** https://daniesolinho.github.io/ateline/

![Página inicial](docs/home.png)

| Página do bolo, com calendário de disponibilidade | Catálogo no celular |
| --- | --- |
| ![Página do bolo](docs/bolo.png) | ![Catálogo no celular](docs/celular.png) |

> As fotos dos bolos ainda estão sendo produzidas. Por enquanto, os cards mostram "Foto em breve".

## O problema

Hoje o atendimento da Ateline é todo pelo WhatsApp: a cliente pergunta se o bolo está livre, a loja confere a agenda, passa os valores, manda o contrato e cobra o sinal. O site automatiza esse caminho: mostra só o que está livre na data da festa, calcula retirada e devolução, registra o aceite do contrato e organiza o pedido.

## O que o site faz

- **Aluguel pela data da festa:** o calendário bloqueia as datas em que a peça já está reservada. A retirada é no último dia de loja aberta antes da festa e a devolução no primeiro dia depois (a loja fecha domingo e segunda).
- **Montar a reserva:** tamanho (número de andares), decoração, topo opcional, base dourada e personalização (nome, idade ou inicial). O topo e a base também têm agenda própria.
- **Filtro "só livres nessa data"** no catálogo, além de busca por nome, tema e decoração.
- **Compra:** com 50% de sinal, retirada grátis na loja ou envio por transportadora. O CEP preenche o endereço sozinho (ViaCEP), e o orçamento do frete vai pronto para o WhatsApp da loja.
- **Encomenda:** formulário de orçamento para um bolo novo e a opção de **refazer** um bolo que saiu do acervo, com cupom de desconto e antecedência mínima de 20 dias.
- **Carrinho e checkout** com aluguel e compra no mesmo pedido, validação de CPF e telefone, aceite do contrato e chave Pix para devolver a taxa de segurança.
- **Minha conta:** próxima retirada, histórico de pedidos, situação de cada item e dados pessoais.
- **Catálogo vindo de uma planilha:** a dona da loja cadastra os bolos no Excel, e um script valida e gera o JSON que o site usa.

## Tecnologias

- [Next.js 16](https://nextjs.org) (App Router) com exportação estática
- React 19 e TypeScript
- Tailwind CSS 4
- [Zod](https://zod.dev) para validar os formulários
- [Vitest](https://vitest.dev) para os testes
- [ExcelJS](https://github.com/exceljs/exceljs) para importar a planilha
- GitHub Actions + GitHub Pages para testar e publicar a cada `git push`

## Decisões técnicas

- **Site estático no GitHub Pages.** Nesta fase não há servidor: as páginas são geradas na hora de publicar (`output: "export"`), e uma página para cada bolo é criada com `generateStaticParams`.
- **Regras de negócio em funções puras e testadas.** Datas de retirada e devolução, disponibilidade, valores do carrinho, cupom e validação do checkout ficam em `lib/`, separados das telas, com 86 testes.
- **Carrinho e pedidos no navegador.** Enquanto não há back-end, ficam no `localStorage`, lidos com `useSyncExternalStore`. Assim a página funciona igual no servidor e no navegador, e as abas abertas ficam sincronizadas.
- **Planilha como fonte dos dados.** `npm run importar` lê `dados-fonte/catalogo.xlsx`, aponta erros (código repetido, preço faltando, topo inexistente) e só grava `data/catalogo.json` se estiver tudo certo.
- **Datas sem surpresa de fuso horário:** todas as contas com datas usam UTC e o formato `AAAA-MM-DD`.

## Acessibilidade e SEO

- Auditoria com [axe](https://github.com/dequelabs/axe-core) em todas as páginas, no computador e no celular, sem nenhum problema apontado nas regras WCAG 2.1 A e AA.
- Navegação completa pelo teclado, link "Pular para o conteúdo", contorno de foco visível e calendário com nomes completos das datas para leitores de tela.
- Título, descrição e link canônico em cada página, `sitemap.xml`, `robots.txt`, imagem de compartilhamento e dados estruturados da loja (schema.org).

## Como rodar no seu computador

Precisa do [Node.js](https://nodejs.org) 24 ou mais recente.

```bash
git clone https://github.com/DanieSolinho/ateline.git
cd ateline
npm install
npm run dev
```

Abra http://localhost:3000.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Site em modo de desenvolvimento |
| `npm test` | Roda os testes |
| `npm run lint` | Confere o código com o ESLint |
| `npm run build` | Gera o site estático na pasta `out/` |
| `npm run importar` | Lê a planilha e atualiza o catálogo |

## Estrutura

```
app/          páginas (rotas do App Router)
components/   componentes de tela, separados por página
hooks/        carrinho, pedidos e "hoje" guardados no navegador
lib/          regras de negócio e funções testadas
types/        tipos do catálogo, do carrinho e dos pedidos
data/         catálogo e reservas em JSON
scripts/      importador da planilha
dados-fonte/  planilha preenchida pela loja
```

## Próximos passos

- Back-end com [Supabase](https://supabase.com): login, pedidos e reservas num banco de dados
- Pagamento pelo Mercado Pago (Pix e cartão), com confirmação automática
- Contrato em PDF enviado por e-mail
- Painel da loja: agenda do dia, checklist de devolução e cálculo da taxa de segurança
- Fotos dos bolos e kits "pegue e monte"

## Autora

Feito por **Daniella** ([@DanieSolinho](https://github.com/DanieSolinho)), desenvolvedora front-end, em parceria com a Ateline Ateliê.

