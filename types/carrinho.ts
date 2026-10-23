export type ExtraDoItem = {
  codigo: string;
  nome: string;
  preco: number;
};

// Um bolo alugado para uma festa
export type ItemAluguel = {
  tipo: "aluguel";
  codigoBolo: string; // "JARDIM_001": a peça física que fica reservada
  codigoOpcao: string; // "JARDIM_001_FLORES_3A"
  nome: string; // "Jardim encantado · Flores · 3 andares"
  festa: string; // "2026-10-31"
  precoOpcao: number;
  topo: ExtraDoItem | null;
  base: ExtraDoItem | null;
  personalizacao: string | null; // "Nome: Alice · Idade: 5"
};

// Um bolo comprado: a peça sai do acervo e fica com a cliente
export type ItemCompra = {
  tipo: "compra";
  codigoBolo: string;
  codigoOpcao: string;
  nome: string;
  preco: number;
  personalizacao: string | null;
};

export type ItemCarrinho = ItemAluguel | ItemCompra;

// Tudo o que pode acontecer com o carrinho
export type AcaoCarrinho =
  | { tipo: "adicionar"; item: ItemCarrinho }
  | { tipo: "remover"; chave: string }
  | { tipo: "esvaziar" };
