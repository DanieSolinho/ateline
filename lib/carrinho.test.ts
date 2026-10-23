import { describe, expect, it } from "vitest";
import { carrinhoReducer, chaveDoItem, resumoDoCarrinho, totalDoItem } from "./carrinho";
import type { ItemAluguel, ItemCompra } from "@/types/carrinho";

const jardim: ItemAluguel = {
  tipo: "aluguel",
  codigoBolo: "JARDIM_001",
  codigoOpcao: "JARDIM_001_FLORES_3A",
  nome: "Jardim encantado · Flores · 3 andares",
  festa: "2026-10-31",
  precoOpcao: 140,
  topo: { codigo: "TOPO_001", nome: "Coroa dourada", preco: 30 },
  base: { codigo: "BASE_DOURADA_001", nome: "Base dourada", preco: 40 },
  personalizacao: "Nome: Alice",
};

const safari: ItemAluguel = {
  tipo: "aluguel",
  codigoBolo: "SAFARI_001",
  codigoOpcao: "SAFARI_001_3A",
  nome: "Safari · 3 andares",
  festa: "2026-10-31",
  precoOpcao: 150,
  topo: null,
  base: null,
  personalizacao: null,
};

const compraSafari: ItemCompra = {
  tipo: "compra",
  codigoBolo: "SAFARI_001",
  codigoOpcao: "SAFARI_001_3A",
  nome: "Safari · 3 andares",
  preco: 420,
  personalizacao: null,
};

describe("totalDoItem", () => {
  it("aluguel soma opção, topo e base", () => {
    expect(totalDoItem(jardim)).toBe(210);
    expect(totalDoItem(safari)).toBe(150);
  });

  it("compra é o preço de venda", () => {
    expect(totalDoItem(compraSafari)).toBe(420);
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

  it("comprar uma peça tira os aluguéis dela do carrinho, e vice-versa", () => {
    expect(carrinhoReducer([jardim, safari], { tipo: "adicionar", item: compraSafari })).toEqual([
      jardim,
      compraSafari,
    ]);
    expect(carrinhoReducer([compraSafari], { tipo: "adicionar", item: safari })).toEqual([safari]);
  });

  it("remove só o item certo", () => {
    expect(carrinhoReducer([jardim, safari], { tipo: "remover", chave: chaveDoItem(jardim) })).toEqual([safari]);
  });

  it("esvazia", () => {
    expect(carrinhoReducer([jardim, safari], { tipo: "esvaziar" })).toEqual([]);
  });
});

describe("resumoDoCarrinho", () => {
  it("aluguel: sinal de 50% e uma taxa de segurança por bolo", () => {
    // locação 210 + 150 = 360 → sinal 180 → na retirada 180 + 2 × 50
    expect(resumoDoCarrinho([jardim, safari])).toMatchObject({
      locacao: 360,
      sinal: 180,
      taxas: 100,
      naRetirada: 280,
      pagarAgora: 180,
      temCompra: false,
    });
  });

  it("compra: sinal de 50% agora, sem taxa de segurança", () => {
    expect(resumoDoCarrinho([jardim, compraSafari])).toMatchObject({
      sinal: 105,
      taxas: 50,
      compras: 420,
      sinalCompras: 210,
      restanteCompras: 210,
      pagarAgora: 315,
      temAluguel: true,
      temCompra: true,
    });
  });
});
