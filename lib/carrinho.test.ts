import { describe, expect, it } from "vitest";
import { carrinhoReducer, resumoDoCarrinho, totalDoItem } from "./carrinho";
import type { ItemCarrinho } from "@/types/carrinho";

const jardim: ItemCarrinho = {
  codigoBolo: "JARDIM_001",
  codigoOpcao: "JARDIM_001_FLORES_3A",
  nome: "Jardim encantado · Flores · 3 andares",
  festa: "2026-10-31",
  precoOpcao: 140,
  topo: { codigo: "TOPO_001", nome: "Coroa dourada", preco: 30 },
  base: { codigo: "BASE_DOURADA_001", nome: "Base dourada", preco: 40 },
  personalizacao: "Nome: Alice",
};

const safari: ItemCarrinho = {
  codigoBolo: "SAFARI_001",
  codigoOpcao: "SAFARI_001_3A",
  nome: "Safari · 3 andares",
  festa: "2026-10-31",
  precoOpcao: 150,
  topo: null,
  base: null,
  personalizacao: null,
};

describe("totalDoItem", () => {
  it("soma opção, topo e base", () => {
    expect(totalDoItem(jardim)).toBe(210);
    expect(totalDoItem(safari)).toBe(150);
  });
});

describe("carrinhoReducer", () => {
  it("adiciona um item", () => {
    expect(carrinhoReducer([], { tipo: "adicionar", item: safari })).toEqual([safari]);
  });

  it("o mesmo bolo na mesma festa substitui o anterior (ex.: trocou o número de andares)", () => {
    const outraOpcao = { ...safari, codigoOpcao: "SAFARI_001_4A", precoOpcao: 180 };
    expect(carrinhoReducer([safari], { tipo: "adicionar", item: outraOpcao })).toEqual([outraOpcao]);
  });

  it("aceita o mesmo bolo em outra data", () => {
    const outraData = { ...safari, festa: "2026-11-07" };
    expect(carrinhoReducer([safari], { tipo: "adicionar", item: outraData })).toHaveLength(2);
  });

  it("remove só o item certo", () => {
    expect(
      carrinhoReducer([jardim, safari], { tipo: "remover", codigoBolo: "JARDIM_001", festa: "2026-10-31" }),
    ).toEqual([safari]);
  });

  it("esvazia", () => {
    expect(carrinhoReducer([jardim, safari], { tipo: "esvaziar" })).toEqual([]);
  });
});

describe("resumoDoCarrinho", () => {
  it("sinal de 50% e uma taxa de segurança por bolo", () => {
    // locação 210 + 150 = 360 → sinal 180 → na retirada 180 + 2 × 50
    expect(resumoDoCarrinho([jardim, safari])).toEqual({ locacao: 360, sinal: 180, taxas: 100, naRetirada: 280 });
  });
});
