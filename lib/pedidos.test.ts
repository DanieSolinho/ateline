import { describe, expect, it } from "vitest";
import { mensagemDeErroDoPedido, mensagemDoSinal, pedidoDaLinha, type LinhaDePedido } from "./pedidos";
import type { DadosCheckout } from "@/lib/checkout";
import type { ItemAluguel } from "@/types/carrinho";

const safari: ItemAluguel = {
  tipo: "aluguel",
  codigoBolo: "SAFARI_001",
  codigoOpcao: "SAFARI_001_3A",
  nome: "Safari · 3 andares",
  festa: "2026-11-21",
  precoOpcao: 150,
  topo: { codigo: "TOPO_001", nome: "Coroa dourada", preco: 30 },
  base: { codigo: "BASE_DOURADA_002", nome: "Base dourada", preco: 40 },
  personalizacao: null,
};

describe("mensagemDeErroDoPedido", () => {
  it("diz qual peça foi reservada por outra pessoa", () => {
    expect(mensagemDeErroDoPedido("PECA_RESERVADA:SAFARI_001", [safari])).toContain("O bolo Safari · 3 andares");
    expect(mensagemDeErroDoPedido("PECA_RESERVADA:TOPO_001", [safari])).toContain("O topo Coroa dourada");
    expect(mensagemDeErroDoPedido("PECA_RESERVADA:BASE_DOURADA_002", [safari])).toContain("base dourada");
  });

  it("tem mensagem para os outros erros", () => {
    expect(mensagemDeErroDoPedido("DATA_INVALIDA", [safari])).toContain("já passou");
    expect(mensagemDeErroDoPedido("Failed to fetch", [safari])).toContain("internet");
  });
});

describe("pedidoDaLinha", () => {
  it("converte a linha do banco para o formato do site", () => {
    const linha = {
      numero: "ATL-1001",
      status: "aguardando_pagamento",
      criado_em: "2026-10-26T17:00:00+00:00",
      guardado_ate: "2026-10-26T19:00:00+00:00",
      cliente: { nome: "Maria" },
      itens: [safari],
      pago_agora: "110.00",
      na_retirada: 160,
      restante_compra: 0,
    } as unknown as LinhaDePedido;
    expect(pedidoDaLinha(linha)).toMatchObject({
      numero: "ATL-1001",
      status: "aguardando_pagamento",
      guardadoAte: "2026-10-26T19:00:00+00:00",
      pagoAgora: 110,
      naRetirada: 160,
    });
  });
});

describe("mensagemDoSinal", () => {
  it("leva o número do pedido, o valor e a forma de pagamento", () => {
    const pix = { numero: "ATL-1001", cliente: { pagamento: "pix" } as DadosCheckout };
    expect(mensagemDoSinal(pix, "R$ 75,00")).toBe(
      "Olá! Fiz o pedido ATL-1001 pelo site e quero pagar o sinal de R$ 75,00 por Pix.",
    );
    const cartao = { numero: "ATL-1002", cliente: { pagamento: "cartao" } as DadosCheckout };
    expect(mensagemDoSinal(cartao, "R$ 75,00")).toContain("no cartão");
  });
});
