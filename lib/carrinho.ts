import { PERCENTUAL_SINAL, TAXA_SEGURANCA } from "@/lib/regras";
import type { AcaoCarrinho, ItemAluguel, ItemCarrinho, ItemCompra } from "@/types/carrinho";

// Identifica um item: o mesmo bolo pode ser alugado para festas diferentes, mas só comprado uma vez
export function chaveDoItem(item: ItemCarrinho): string {
  return item.tipo === "aluguel" ? `${item.codigoBolo}@${item.festa}` : `${item.codigoBolo}@compra`;
}

// Preço de um item. Aluguel: opção + topo + base dourada. Compra: o preço de venda.
export function totalDoItem(item: ItemCarrinho): number {
  if (item.tipo === "compra") return item.preco;
  return item.precoOpcao + (item.topo?.preco ?? 0) + (item.base?.preco ?? 0);
}

// Reducer: recebe o carrinho atual e uma ação, e devolve o carrinho novo (sem alterar o antigo)
export function carrinhoReducer(itens: ItemCarrinho[], acao: AcaoCarrinho): ItemCarrinho[] {
  switch (acao.tipo) {
    case "adicionar": {
      const novo = acao.item;
      const restantes = itens.filter((item) => {
        // O mesmo bolo na mesma festa (ou a mesma compra) é substituído
        if (chaveDoItem(item) === chaveDoItem(novo)) return false;
        // Uma peça não pode ser comprada e alugada no mesmo pedido: fica a escolha mais recente
        if (item.codigoBolo === novo.codigoBolo && item.tipo !== novo.tipo) return false;
        return true;
      });
      return [...restantes, novo];
    }
    case "remover":
      return itens.filter((item) => chaveDoItem(item) !== acao.chave);
    case "esvaziar":
      return [];
  }
}

export function alugueisDo(itens: ItemCarrinho[]): ItemAluguel[] {
  return itens.filter((item): item is ItemAluguel => item.tipo === "aluguel");
}

export function comprasDo(itens: ItemCarrinho[]): ItemCompra[] {
  return itens.filter((item): item is ItemCompra => item.tipo === "compra");
}

export function resumoDoCarrinho(itens: ItemCarrinho[]) {
  const alugueis = alugueisDo(itens);
  const compras = comprasDo(itens);

  const locacao = alugueis.reduce((total, item) => total + totalDoItem(item), 0);
  const sinal = locacao * PERCENTUAL_SINAL; // aluguel: 50% agora
  const taxas = alugueis.length * TAXA_SEGURANCA; // uma taxa de segurança por bolo alugado
  // Compra: 50% de sinal agora. O restante (e o frete, se for envio) antes do envio ou na retirada.
  const totalCompras = compras.reduce((total, item) => total + totalDoItem(item), 0);
  const sinalCompras = totalCompras * PERCENTUAL_SINAL;

  return {
    locacao,
    sinal,
    taxas,
    naRetirada: locacao - sinal + taxas,
    compras: totalCompras,
    sinalCompras,
    restanteCompras: totalCompras - sinalCompras,
    pagarAgora: sinal + sinalCompras,
    temAluguel: alugueis.length > 0,
    temCompra: compras.length > 0,
  };
}
