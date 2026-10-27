import { describe, expect, it } from "vitest";
import { bolosLivresNaData, festaDoEndereco } from "./alternativas";
import type { BoloVitrine } from "@/types/catalogo";

const bolo = (codigo: string, tema: string, preco: number) =>
  ({ codigo, tema, nome: codigo, menorPrecoLocacao: preco }) as BoloVitrine;

const escolhido = bolo("SAFARI_001", "Safari", 150);
const bolos = [
  escolhido,
  bolo("JARDIM_001", "Jardim", 140),
  bolo("SAFARI_002", "Safari", 300),
  bolo("CIRCO_001", "Circo", 400),
  bolo("PRINCESA_001", "Princesa", 160),
];
const reservas = [
  { codigo: "SAFARI_001", festa: "2026-11-21" },
  { codigo: "PRINCESA_001", festa: "2026-11-21" },
];

describe("bolosLivresNaData", () => {
  it("mostra só os livres, mesmo tema primeiro e depois o preço mais parecido", () => {
    const livres = bolosLivresNaData(bolos, "2026-11-21", reservas, escolhido);
    expect(livres.map((b) => b.codigo)).toEqual(["SAFARI_002", "JARDIM_001", "CIRCO_001"]);
  });

  it("respeita o limite", () => {
    expect(bolosLivresNaData(bolos, "2026-11-21", reservas, escolhido, 1)).toHaveLength(1);
  });
});

describe("festaDoEndereco", () => {
  it("lê a data do link e ignora valores estranhos", () => {
    expect(festaDoEndereco("?festa=2026-11-21")).toBe("2026-11-21");
    expect(festaDoEndereco("?festa=amanha")).toBeNull();
    expect(festaDoEndereco("")).toBeNull();
  });
});
