import { describe, expect, it } from "vitest";
import { mensagemDeAvisoDeEspera } from "./espera";

describe("mensagemDeAvisoDeEspera", () => {
  it("usa o primeiro nome, o bolo, a data e o link", () => {
    expect(
      mensagemDeAvisoDeEspera("Ana Souza", "Safari", "sábado, 21/11", "https://site/bolo/SAFARI_001/?festa=2026-11-21"),
    ).toBe(
      "Olá, Ana! Aqui é da Ateline. O bolo Safari ficou livre para sábado, 21/11. Se ainda quiser, é só reservar pelo site: https://site/bolo/SAFARI_001/?festa=2026-11-21",
    );
  });
});
