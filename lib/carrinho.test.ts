import { describe, expect, it } from "vitest";
import { carrinhoReducer, resumoDoCarrinho } from "./carrinho";
import type { ItemCarrinho } from "@/types/carrinho";

const tiana: ItemCarrinho = { codigo: "0211", nome: "Bolo Tiana", precoLocacao: 70, festa: "2026-10-31" };
const kit: ItemCarrinho = { codigo: "9005", nome: "Exemplo Kit Jardim", precoLocacao: 250, festa: "2026-10-31" };

describe("carrinhoReducer", () => {
  it("adiciona um item", () => {
    expect(carrinhoReducer([], { tipo: "adicionar", item: tiana })).toEqual([tiana]);
  });

  it("não duplica o mesmo bolo na mesma data", () => {
    expect(carrinhoReducer([tiana], { tipo: "adicionar", item: tiana })).toEqual([tiana]);
  });

  it("aceita o mesmo bolo em outra data", () => {
    const outraData = { ...tiana, festa: "2026-11-07" };
    expect(carrinhoReducer([tiana], { tipo: "adicionar", item: outraData })).toHaveLength(2);
  });

  it("remove só o item certo", () => {
    expect(carrinhoReducer([tiana, kit], { tipo: "remover", codigo: "0211", festa: "2026-10-31" })).toEqual([kit]);
  });

  it("esvazia", () => {
    expect(carrinhoReducer([tiana, kit], { tipo: "esvaziar" })).toEqual([]);
  });
});

describe("resumoDoCarrinho", () => {
  it("Bolo Tiana: R$ 35 de sinal e R$ 85 na retirada, como no contrato", () => {
    expect(resumoDoCarrinho([tiana])).toEqual({ locacao: 70, sinal: 35, taxas: 50, naRetirada: 85 });
  });

  it("dois itens: uma taxa de segurança para cada", () => {
    expect(resumoDoCarrinho([tiana, kit])).toEqual({ locacao: 320, sinal: 160, taxas: 100, naRetirada: 260 });
  });
});