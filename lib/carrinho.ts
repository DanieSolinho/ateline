import { PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";
import type { AcaoCarrinho, ItemCarrinho } from "@/types/carrinho";

// Reducer: recebe o carrinho atual e uma ação, e devolve o carrinho novo (sem alterar o antigo)
export function carrinhoReducer(itens: ItemCarrinho[], acao: AcaoCarrinho): ItemCarrinho[] {
  switch (acao.tipo) {
    case "adicionar": {
      const jaEsta = itens.some(
        (item) => item.codigo === acao.item.codigo && item.festa === acao.item.festa,
      );
      return jaEsta ? itens : [...itens, acao.item];
    }
    case "remover":
      return itens.filter((item) => !(item.codigo === acao.codigo && item.festa === acao.festa));
    case "esvaziar":
      return [];
  }
}

export function resumoDoCarrinho(itens: ItemCarrinho[]) {
  const locacao = itens.reduce((total, item) => total + item.precoLocacao, 0);
  const sinal = locacao * PERCENTUAL_SINAL;
  const taxas = itens.length * TAXA_SEGURANCA; // uma taxa de segurança por peça
  return { locacao, sinal, taxas, naRetirada: locacao - sinal + taxas };
}