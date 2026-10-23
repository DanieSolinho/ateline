// O formato do catálogo depois de importado da planilha da Ateline

export type StatusPeca = "disponivel" | "alugado" | "manutencao" | "inativo";
export type Personalizacao = "nenhuma" | "nome" | "idade" | "nome_idade" | "inicial";
export type TipoTopo = "fixo" | "opcional" | "sem_topo";

// Aba "Bolos": uma linha por peça física
export type BoloCatalogo = {
  codigo: string; // "SAFARI_001"
  nome: string;
  tema: string;
  andaresMin: number;
  andaresMax: number;
  tipoTopo: TipoTopo;
  toposCompativeis: string[]; // ["TOPO_001", "TOPO_003"]
  aceitaBaseDourada: boolean;
  personalizacao: Personalizacao;
  status: StatusPeca;
  previsaoVolta: string | null; // "2026-10-28"
  podeSerRefeito: boolean;
};

// Aba "Opções de aluguel": uma linha por decoração + número de andares
export type OpcaoAluguel = {
  codigo: string; // "JARDIM_001_FLORES_3A"
  codigoBolo: string; // "JARDIM_001"
  decoracao: string | null; // "Flores"
  andares: number;
  precoLocacao: number;
  precoVenda: number | null;
  precoEncomendaNova: number | null;
};

// Abas "Topos" e "Andar avulso"
export type Acessorio = {
  codigo: string;
  nome: string;
  descricao: string;
  precoLocacao: number;
  status: StatusPeca;
  previsaoVolta: string | null;
};

export type Catalogo = {
  bolos: BoloCatalogo[];
  opcoes: OpcaoAluguel[];
  topos: Acessorio[];
  bases: Acessorio[];
};
// Um bolo pronto para a vitrine do site: o bolo + as opções dele + os menores preços
export type BoloVitrine = BoloCatalogo & {
  opcoes: OpcaoAluguel[];
  menorPrecoLocacao: number;
  menorPrecoVenda: number | null;
  decoracoes: string[];
};
