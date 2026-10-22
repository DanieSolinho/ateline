import { describe, expect, it } from "vitest";
import { calcularPeriodo, estaDisponivel, periodosSeSobrepoem } from "./periodo";

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