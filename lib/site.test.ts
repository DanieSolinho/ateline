import { describe, expect, it } from "vitest";
import { urlCompleta } from "./site";

describe("urlCompleta", () => {
  it("junta o endereço do site com o caminho, com barra no fim (como no GitHub Pages)", () => {
    expect(urlCompleta("/")).toBe("https://daniesolinho.github.io/ateline/");
    expect(urlCompleta("/alugar")).toBe("https://daniesolinho.github.io/ateline/alugar/");
    expect(urlCompleta("/bolo/SAFARI_001/")).toBe("https://daniesolinho.github.io/ateline/bolo/SAFARI_001/");
  });
});
