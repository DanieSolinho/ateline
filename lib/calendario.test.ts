import { describe, expect, it } from "vitest";
import { diaPorExtenso, diasDoMes, horarioDaLoja, nomeDoMes } from "./calendario";

describe("diasDoMes", () => {
  it("outubro de 2026 começa numa quinta: 4 espaços vazios antes do dia 1", () => {
    const dias = diasDoMes(2026, 9);
    expect(dias.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
    expect(dias.at(-1)).toBe("2026-10-31");
    expect(dias).toHaveLength(35);
  });

  it("fevereiro de 2028 tem 29 dias (ano bissexto)", () => {
    expect(diasDoMes(2028, 1).at(-1)).toBe("2028-02-29");
  });
});

describe("textos de data", () => {
  it("escreve o mês por extenso", () => {
    expect(nomeDoMes(2026, 9)).toBe("outubro de 2026");
  });

  it("escreve o dia da semana", () => {
    expect(diaPorExtenso("2026-10-24")).toBe("sábado, 24/10");
  });

  it("usa o horário de sábado e o de dia de semana", () => {
    expect(horarioDaLoja("2026-10-24", "retirada")).toBe("das 10h às 14h");
    expect(horarioDaLoja("2026-10-23", "retirada")).toBe("a partir das 14h");
    expect(horarioDaLoja("2026-10-27", "devolucao")).toBe("a partir das 10h");
  });
});