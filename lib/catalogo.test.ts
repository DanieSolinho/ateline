import { describe, expect, it } from "vitest";
import dados from "@/data/catalogo.json";
import { montarRefaziveis, montarVitrine } from "./catalogo";
import type { BoloCatalogo, Catalogo, OpcaoAluguel } from "@/types/catalogo";

const bolo: BoloCatalogo = {
  codigo: "SAFARI_001",
  nome: "Safari",
  tema: "Safari",
  andaresMin: 3,
  andaresMax: 5,
  tipoTopo: "fixo",
  toposCompativeis: [],
  aceitaBaseDourada: true,
  personalizacao: "nome_idade",
  status: "disponivel",
  previsaoVolta: null,
  podeSerRefeito: false,
};

function opcao(andares: number, precoLocacao: number, precoVenda: number | null = null): OpcaoAluguel {
  return {
    codigo: `SAFARI_001_${andares}A`,
    codigoBolo: "SAFARI_001",
    decoracao: null,
    andares,
    precoLocacao,
    precoVenda,
    precoEncomendaNova: null,
  };
}

function catalogoCom(bolos: BoloCatalogo[], opcoes: OpcaoAluguel[]): Catalogo {
  return { bolos, opcoes, topos: [], bases: [], cupomRefazer: null };
}

describe("montarVitrine", () => {
  it("junta as opções ao bolo e calcula os menores preços", () => {
    const [vitrine] = montarVitrine(catalogoCom([bolo], [opcao(4, 180, 800), opcao(3, 150, 650)]));
    expect(vitrine.opcoes.map((o) => o.andares)).toEqual([3, 4]);
    expect(vitrine.menorPrecoLocacao).toBe(150);
    expect(vitrine.menorPrecoVenda).toBe(650);
  });

  it("sem preço de venda em nenhuma opção, a compra fica null", () => {
    const [vitrine] = montarVitrine(catalogoCom([bolo], [opcao(3, 150)]));
    expect(vitrine.menorPrecoVenda).toBeNull();
  });

  it("bolo alugado continua na vitrine; em manutenção e inativo saem", () => {
    const status = ["alugado", "manutencao", "inativo"] as const;
    const bolos = status.map((s, i) => ({ ...bolo, codigo: `B${i}`, status: s }));
    const opcoes = bolos.map((b) => ({ ...opcao(3, 150), codigo: `${b.codigo}_3A`, codigoBolo: b.codigo }));
    expect(montarVitrine(catalogoCom(bolos, opcoes)).map((b) => b.codigo)).toEqual(["B0"]);
  });

  it("bolo sem opção de aluguel não aparece", () => {
    expect(montarVitrine(catalogoCom([bolo], []))).toEqual([]);
  });
});

describe("montarRefaziveis", () => {
  const inativo = { ...bolo, status: "inativo" as const, podeSerRefeito: true };

  it("lista só bolos inativos que podem ser refeitos e têm preço de encomenda nova", () => {
    const comPreco = { ...opcao(3, 150), precoEncomendaNova: 400 };
    expect(montarRefaziveis(catalogoCom([inativo], [comPreco]))).toHaveLength(1);
    expect(montarRefaziveis(catalogoCom([inativo], [opcao(3, 150)]))).toHaveLength(0);
    expect(montarRefaziveis(catalogoCom([{ ...inativo, podeSerRefeito: false }], [comPreco]))).toHaveLength(0);
    expect(montarRefaziveis(catalogoCom([bolo], [comPreco]))).toHaveLength(0);
  });
});

// Confere o arquivo de verdade, gerado pela planilha
describe("data/catalogo.json", () => {
  const catalogo = dados as Catalogo;

  it("toda opção tem preço de aluguel", () => {
    for (const o of catalogo.opcoes) expect(o.precoLocacao, o.codigo).toBeGreaterThan(0);
  });

  it("todo topo compatível existe na lista de topos", () => {
    const codigos = catalogo.topos.map((t) => t.codigo);
    for (const b of catalogo.bolos) {
      for (const t of b.toposCompativeis) expect(codigos, `${b.codigo} → ${t}`).toContain(t);
    }
  });
});
