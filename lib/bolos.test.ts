import { describe, expect, it } from "vitest";
import dados from "@/data/bolos.json";

// O "as Bolo[]" em lib/bolos.ts confia no JSON sem conferir.
// Este teste confere de verdade, para nenhum bolo ir para o site sem preço.
describe("data/bolos.json", () => {
  it.each(dados.map((bolo) => [bolo.codigo, bolo]))("%s tem preço de aluguel e de venda", (_, bolo) => {
    expect(bolo.precoLocacao).toBeGreaterThan(0);
    expect(bolo.precoVenda).toBeGreaterThan(0);
  });

  it("não repete códigos", () => {
    const codigos = dados.map((bolo) => bolo.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});