import { describe, expect, it } from "vitest";
import { calcularPeriodo, estaDisponivel, periodosSeSobrepoem, primeiraUnidadeLivre, livreParaVenda } from "./periodo";

describe("calcularPeriodo", () => {
  it("festa no sábado: retira na sexta e devolve na terça", () => {
    expect(calcularPeriodo("2026-10-24")).toEqual({
      retirada: "2026-10-23",
      festa: "2026-10-24",
      devolucao: "2026-10-27",
    });
  });

  it("festa na sexta: retira na quinta e devolve no sábado", () => {
    expect(calcularPeriodo("2026-10-23")).toMatchObject({
      retirada: "2026-10-22",
      devolucao: "2026-10-24",
    });
  });

  it("festa no domingo: igual ao contrato da Bolo Tiana (24/10 a 27/10)", () => {
    expect(calcularPeriodo("2026-10-25")).toMatchObject({
      retirada: "2026-10-24",
      devolucao: "2026-10-27",
    });
  });

  it("festa na terça: retira no sábado anterior, porque domingo e segunda a loja fecha", () => {
    expect(calcularPeriodo("2026-10-27")).toMatchObject({
      retirada: "2026-10-24",
      devolucao: "2026-10-28",
    });
  });

  it("muda de mês corretamente", () => {
    expect(calcularPeriodo("2026-10-31")).toMatchObject({
      retirada: "2026-10-30",
      devolucao: "2026-11-03",
    });
  });
});

describe("periodosSeSobrepoem", () => {
  it("detecta quando os períodos se cruzam", () => {
    expect(
      periodosSeSobrepoem(calcularPeriodo("2026-10-24"), calcularPeriodo("2026-10-25")),
    ).toBe(true);
  });

  it("libera fins de semana diferentes", () => {
    expect(
      periodosSeSobrepoem(calcularPeriodo("2026-10-24"), calcularPeriodo("2026-10-31")),
    ).toBe(false);
  });
});

describe("estaDisponivel", () => {
  const reservas = [{ codigo: "0211", festa: "2026-10-24" }];

  it("bloqueia o mesmo bolo no mesmo fim de semana", () => {
    expect(estaDisponivel("0211", "2026-10-25", reservas)).toBe(false);
  });

  it("libera o mesmo bolo em outra semana", () => {
    expect(estaDisponivel("0211", "2026-10-31", reservas)).toBe(true);
  });

  it("libera outro bolo na mesma data", () => {
    expect(estaDisponivel("9001", "2026-10-25", reservas)).toBe(true);
  });
});

describe("primeiraUnidadeLivre", () => {
  const bases = ["BASE_DOURADA_001", "BASE_DOURADA_002"];

  it("pula a unidade reservada e devolve a próxima", () => {
    const reservas = [{ codigo: "BASE_DOURADA_001", festa: "2026-11-07" }];
    expect(primeiraUnidadeLivre(bases, "2026-11-07", reservas)).toBe("BASE_DOURADA_002");
  });

  it("devolve null quando todas estão reservadas", () => {
    const reservas = bases.map((codigo) => ({ codigo, festa: "2026-11-07" }));
    expect(primeiraUnidadeLivre(bases, "2026-11-07", reservas)).toBeNull();
  });
});

describe("livreParaVenda", () => {
  const reservas = [{ codigo: "SAFARI_001", festa: "2026-10-31" }];

  it("bloqueia a venda enquanto houver aluguel marcado", () => {
    expect(livreParaVenda("SAFARI_001", "2026-10-23", reservas)).toBe(false);
  });

  it("libera depois que a peça volta, e não afeta outras peças", () => {
    expect(livreParaVenda("SAFARI_001", "2026-11-05", reservas)).toBe(true);
    expect(livreParaVenda("JARDIM_001", "2026-10-23", reservas)).toBe(true);
  });
});
