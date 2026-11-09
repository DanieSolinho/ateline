import { describe, expect, it } from "vitest";
import { codigoDaPasta, ehFoto, ehHeic, ordenarFotos } from "./fotos";

describe("pastas de fotos", () => {
  it("o nome da pasta vira o código, mesmo com minúscula, espaço ou acento", () => {
    expect(codigoDaPasta("ABELHINHA_001")).toBe("ABELHINHA_001");
    expect(codigoDaPasta(" abelhinha_001 ")).toBe("ABELHINHA_001");
    expect(codigoDaPasta("Arca de Noé 002")).toBe("ARCA_DE_NOE_002");
    expect(codigoDaPasta("alice-002-4a")).toBe("ALICE_002_4A");
  });

  it("aceita JPG, PNG e WebP; ignora arquivos ocultos e outros tipos", () => {
    expect(ehFoto("ABELHINHA_001-01.JPG")).toBe(true);
    expect(ehFoto("foto.jpeg")).toBe(true);
    expect(ehFoto("foto.png")).toBe(true);
    expect(ehFoto(".DS_Store")).toBe(false);
    expect(ehFoto("video.mov")).toBe(false);
    expect(ehFoto("IMG_0001.HEIC")).toBe(false);
    expect(ehHeic("IMG_0001.HEIC")).toBe(true);
  });

  it("ordena pelo número como uma pessoa leria", () => {
    expect(ordenarFotos(["X-10.jpg", "X-2.jpg", "X-01.jpg"])).toEqual(["X-01.jpg", "X-2.jpg", "X-10.jpg"]);
  });
});
