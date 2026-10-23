import { describe, expect, it } from "vitest";
import { converterCatalogo, listaDeCodigos, type Linha } from "./converter";

const safari: Linha = {
  "Código do bolo": "SAFARI_001",
  Nome: "Safari",
  Tema: "Safari",
  "Andares mín.": 3,
  "Andares máx.": 5,
  "Tipo de topo": "Opcional",
  "Topos compatíveis": "TOPO_001",
  "Aceita base dourada?": "Sim",
  "Personalização (inclusa no aluguel)": "Nome e idade",
  Status: "Disponível",
};

const opcao3A: Linha = {
  "Código da opção": "SAFARI_001_3A",
  "Código do bolo": "SAFARI_001",
  Andares: 3,
  "Preço aluguel (R$)": 150,
  "Preço venda (R$)": 600,
};

const coroa: Linha = {
  Código: "TOPO_001",
  Nome: "Coroa dourada",
  "Preço aluguel (R$)": 30,
  Status: "Disponível",
};

function converter(
  extra: Partial<{
    bolos: Linha[];
    opcoes: Linha[];
    topos: Linha[];
    bases: Linha[];
    cupom: { codigo: unknown; desconto: unknown };
  }> = {},
) {
  return converterCatalogo({ bolos: [safari], opcoes: [opcao3A], topos: [coroa], bases: [], ...extra });
}

describe("listaDeCodigos", () => {
  it("separa por vírgula, tira espaços e põe em maiúsculas", () => {
    expect(listaDeCodigos("topo_001, TOPO_003 ;")).toEqual(["TOPO_001", "TOPO_003"]);
  });
});

describe("converterCatalogo", () => {
  it("converte os textos da planilha para os códigos do site", () => {
    const { catalogo, erros, avisos } = converter();
    expect(erros).toEqual([]);
    expect(avisos).toEqual([]);
    expect(catalogo.bolos[0]).toMatchObject({
      codigo: "SAFARI_001",
      tipoTopo: "opcional",
      toposCompativeis: ["TOPO_001"],
      aceitaBaseDourada: true,
      personalizacao: "nome_idade",
      status: "disponivel",
    });
  });

  it("aceita a personalização só com a inicial", () => {
    const { catalogo } = converter({ bolos: [{ ...safari, "Personalização (inclusa no aluguel)": "Inicial" }] });
    expect(catalogo.bolos[0].personalizacao).toBe("inicial");
  });

  it("ignora linhas vazias", () => {
    expect(converter({ bolos: [safari, {}] }).catalogo.bolos).toHaveLength(1);
  });

  it("acusa erro quando a opção aponta para um bolo que não existe", () => {
    const { erros } = converter({ opcoes: [{ ...opcao3A, "Código do bolo": "SAFARI_999" }] });
    expect(erros[0]).toContain("SAFARI_999");
  });

  it("acusa erro de status escrito errado", () => {
    const { erros } = converter({ bolos: [{ ...safari, Status: "Disponivel sim" }] });
    expect(erros[0]).toContain("status");
  });

  it("acusa erro de opção sem preço de aluguel", () => {
    const { erros } = converter({ opcoes: [{ ...opcao3A, "Preço aluguel (R$)": null }] });
    expect(erros[0]).toContain("preço de aluguel");
  });

  it("avisa (sem travar) quando falta preço de venda ou os andares saem do limite", () => {
    const { erros, avisos } = converter({
      opcoes: [{ ...opcao3A, Andares: 7, "Preço venda (R$)": null }],
    });
    expect(erros).toEqual([]);
    expect(avisos).toHaveLength(2);
  });

  it("acusa topo compatível que não está na aba Topos", () => {
    const { erros } = converter({ bolos: [{ ...safari, "Topos compatíveis": "TOPO_404" }] });
    expect(erros[0]).toContain("TOPO_404");
  });

  it("acusa códigos repetidos", () => {
    const { erros } = converter({ opcoes: [opcao3A, opcao3A] });
    expect(erros.some((erro) => erro.includes("mais de uma vez"))).toBe(true);
  });
});

describe("cupom dos bolos refeitos", () => {
  it("lê o código e o desconto (0,3 ou 30)", () => {
    expect(converter({ cupom: { codigo: "refaz30", desconto: 0.3 } }).catalogo.cupomRefazer).toEqual({
      codigo: "REFAZ30",
      desconto: 0.3,
    });
    expect(converter({ cupom: { codigo: "REFAZ30", desconto: 30 } }).catalogo.cupomRefazer?.desconto).toBe(0.3);
  });

  it("sem código, fica sem cupom", () => {
    expect(converter().catalogo.cupomRefazer).toBeNull();
  });

  it("acusa desconto impossível", () => {
    expect(converter({ cupom: { codigo: "REFAZ", desconto: 0 } }).erros[0]).toContain("desconto");
  });
});
