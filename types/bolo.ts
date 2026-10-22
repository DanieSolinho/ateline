export type TipoBolo = "bolo" | "mini_kit" | "kit_completo";
export type Modalidade = "aluguel" | "venda" | "ambos";

export type Bolo = {
  codigo: string;          // "0211": texto, para não perder o zero
  nome: string;
  tipo: TipoBolo;
  modalidade: Modalidade;
  tema: string;
  andares: number;
  precoLocacao?: number;   // o ? quer dizer "pode não existir"
  precoVenda?: number;
  foto?: string;
  itensKit?: string[];
};