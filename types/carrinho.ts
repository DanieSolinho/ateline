export type ExtraDoItem = {
  codigo: string;
  nome: string;
  preco: number;
};

export type ItemCarrinho = {
  codigoBolo: string; // "JARDIM_001": a peça física que fica reservada
  codigoOpcao: string; // "JARDIM_001_FLORES_3A"
  nome: string; // "Jardim encantado · Flores · 3 andares"
  festa: string; // "2026-10-31"
  precoOpcao: number;
  topo: ExtraDoItem | null;
  base: ExtraDoItem | null;
  personalizacao: string | null; // "Nome: Alice · Idade: 5"
};

// Tudo o que pode acontecer com o carrinho
export type AcaoCarrinho =
  | { tipo: "adicionar"; item: ItemCarrinho }
  | { tipo: "remover"; codigoBolo: string; festa: string }
  | { tipo: "esvaziar" };
