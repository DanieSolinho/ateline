export type TipoBolo = "bolo" | "mini_kit" | "kit_completo";

export type Bolo = {
  codigo: string;          // "0211": texto, para não perder o zero
  nome: string;
  tipo: TipoBolo;
  tema: string;
  andares: number;
  precoLocacao: number;    // toda peça pode ser alugada…
  precoVenda: number;      // …e comprada
  foto?: string;           // o ? quer dizer "pode não existir"
  itensKit?: string[];
  destaque?: boolean;      // aparece em "Queridinhos" na home
};