import { PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";
import type { AcaoCarrinho, ItemCarrinho } from "@/types/carrinho";

// Preço de um item: a opção + topo + base dourada
export function totalDoItem(item: ItemCarrinho): number {
  return item.precoOpcao + (item.topo?.preco ?? 0) + (item.base?.preco ?? 0);
}

// Reducer: recebe o carrinho atual e uma ação, e devolve o carrinho novo (sem alterar o antigo)
export function carrinhoReducer(itens: ItemCarrinho[], acao: AcaoCarrinho): ItemCarrinho[] {
  switch (acao.tipo) {
    case "adicionar": {
      // O mesmo bolo físico não pode ir duas vezes para a mesma festa
      const semRepetido = itens.filter(
        (item) => !(item.codigoBolo === acao.item.codigoBolo && item.festa === acao.item.festa),
      );
      return [...semRepetido, acao.item];
    }
    case "remover":
      return itens.filter((item) => !(item.codigoBolo === acao.codigoBolo && item.festa === acao.festa));
    case "esvaziar":
      return [];
  }
}

export function resumoDoCarrinho(itens: ItemCarrinho[]) {
  const locacao = itens.reduce((total, item) => total + totalDoItem(item), 0);
  const sinal = locacao * PERCENTUAL_SINAL;
  const taxas = itens.length * TAXA_SEGURANCA; // uma taxa de segurança por bolo
  return { locacao, sinal, taxas, naRetirada: locacao - sinal + taxas };
}
