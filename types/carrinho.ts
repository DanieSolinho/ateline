export type ItemCarrinho = {
  codigo: string;
  nome: string;
  precoLocacao: number;
  festa: string; // "2026-10-31"
};

// Tudo o que pode acontecer com o carrinho
export type AcaoCarrinho =
  | { tipo: "adicionar"; item: ItemCarrinho }
  | { tipo: "remover"; codigo: string; festa: string }
  | { tipo: "esvaziar" };