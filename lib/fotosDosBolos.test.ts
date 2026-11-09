import { describe, expect, it } from "vitest";
import { caminhoDaFoto, fotoDoCartao, fotosDe, nomeDaOpcao } from "./fotosDosBolos";

const mapa = { ABELHINHA_001: ["aaa11111", "bbb22222"], ALICE_002_4A: ["ccc33333"] };

describe("fotos dos bolos", () => {
  it("monta o caminho com o número de 2 dígitos, o tamanho e a versão", () => {
    expect(caminhoDaFoto("ABELHINHA_001", 1, "grande", "aaa11111", "/ateline")).toBe(
      "/ateline/fotos/ABELHINHA_001/ABELHINHA_001-01.webp?v=aaa11111",
    );
    expect(caminhoDaFoto("ABELHINHA_001", 12, "pequena", "x", "")).toBe("/fotos/ABELHINHA_001/ABELHINHA_001-12-p.webp?v=x");
  });

  it("lista as fotos na ordem, com texto alternativo numerado", () => {
    const fotos = fotosDe("ABELHINHA_001", "Abelhinha", mapa, "");
    expect(fotos).toHaveLength(2);
    expect(fotos[0].alt).toBe("Abelhinha, foto 1 de 2");
    expect(fotos[1].grande).toContain("ABELHINHA_001-02.webp");
    expect(fotosDe("ALICE_002_4A", "Alice", mapa, "")[0].alt).toBe("Alice"); // foto única: sem numerar
    expect(fotosDe("SEM_FOTO_001", "X", mapa, "")).toEqual([]);
  });

  it("cartão usa a foto do bolo; sem ela, a da primeira opção com foto; sem nenhuma, nada", () => {
    expect(fotoDoCartao("ABELHINHA_001", [], mapa, "")).toContain("ABELHINHA_001-01-p.webp");
    expect(fotoDoCartao("ALICE_002", ["ALICE_002_3A", "ALICE_002_4A"], mapa, "")).toContain("ALICE_002_4A-01-p.webp");
    expect(fotoDoCartao("AQUARELA_001", ["AQUARELA_001_3A"], mapa, "")).toBeUndefined();
  });

  it("descreve a opção para quem usa leitor de tela", () => {
    expect(nomeDaOpcao("Jardim", 3, "Flores")).toBe("Jardim, 3 andares, Flores");
    expect(nomeDaOpcao("Alice", 4, null)).toBe("Alice, 4 andares");
  });
});
