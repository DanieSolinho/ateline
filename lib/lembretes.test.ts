import { describe, expect, it } from "vitest";
import { mensagemDeLembreteDeDevolucao, mensagemDeLembreteDeRetirada, proximoDiaAberto } from "./lembretes";

describe("proximoDiaAberto", () => {
  it("pula domingo e segunda", () => {
    expect(proximoDiaAberto("2026-11-03")).toBe("2026-11-04"); // terça → quarta
    expect(proximoDiaAberto("2026-11-07")).toBe("2026-11-10"); // sábado → terça
    expect(proximoDiaAberto("2026-11-08")).toBe("2026-11-10"); // domingo → terça
  });
});

describe("mensagens de lembrete", () => {
  it("retirada leva dia, horário, endereço e valor", () => {
    const texto = mensagemDeLembreteDeRetirada("Maria Silva", "Safari", "2026-11-20", 135);
    expect(texto).toContain("Olá, Maria!");
    expect(texto).toContain("sexta-feira, 20/11, a partir das 14h");
    expect(texto).toContain("Praça Seca");
    expect(texto.replace(/\s/g, " ")).toContain("R$ 135,00");
  });

  it("devolução lembra de trazer a peça limpa", () => {
    const texto = mensagemDeLembreteDeDevolucao("Maria", "Safari", "2026-11-24");
    expect(texto).toContain("terça-feira, 24/11, a partir das 10h");
    expect(texto).toContain("limpa e sem cola");
  });
});
