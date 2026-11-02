import { describe, expect, it } from "vitest";
import {
  creditoDoCancelamento,
  diasAte,
  mensagemDeErroDaAlteracao,
  podeAdiar,
  podeCancelar,
  reservasSemOItem,
} from "@/lib/alteracoes";
import { creditoNoPedido } from "@/lib/credito";
import type { ItemAluguel, ItemCompra } from "@/types/carrinho";
import type { Pedido } from "@/types/pedido";

const HOJE = "2026-11-03";
const AGORA = "2026-11-03T12:00:00Z";

const aluguel = (festa: string, extras: Partial<ItemAluguel> = {}): ItemAluguel => ({
  tipo: "aluguel",
  codigoBolo: "SAFARI_001",
  codigoOpcao: "SAFARI_001_3A",
  nome: "Safari",
  festa,
  precoOpcao: 150,
  topo: null,
  base: null,
  personalizacao: null,
  ...extras,
});

const compra: ItemCompra = {
  tipo: "compra",
  codigoBolo: "CIRCO_001",
  codigoOpcao: "CIRCO_001_3A",
  nome: "Circo",
  preco: 400,
  personalizacao: null,
};

const pedido = (extras: Partial<Pedido>): Pedido => ({
  numero: "ATL-1001",
  criadoEm: "2026-11-01T10:00:00Z",
  cliente: { nome: "Maria", email: "m@x.com" } as Pedido["cliente"],
  itens: [aluguel("2026-12-05")],
  pagoAgora: 75,
  naRetirada: 125,
  restanteCompra: 0,
  status: "pago",
  guardadoAte: null,
  ...extras,
});

describe("diasAte", () => {
  it("conta os dias entre duas datas", () => {
    expect(diasAte(HOJE, "2026-11-18")).toBe(15);
    expect(diasAte(HOJE, HOJE)).toBe(0);
    expect(diasAte(HOJE, "2026-11-01")).toBe(-2);
  });
});

describe("podeAdiar", () => {
  it("deixa adiar com o sinal pago e 15 dias ou mais até a festa", () => {
    expect(podeAdiar({ status: "pago" }, aluguel("2026-11-18"), HOJE)).toEqual({ pode: true });
  });
  it("não deixa com menos de 15 dias", () => {
    const resposta = podeAdiar({ status: "pago" }, aluguel("2026-11-17"), HOJE);
    expect(resposta.pode).toBe(false);
  });
  it("não deixa antes de pagar o sinal", () => {
    expect(podeAdiar({ status: "aguardando_pagamento" }, aluguel("2026-12-19"), HOJE).pode).toBe(false);
  });
});

describe("podeCancelar", () => {
  it("deixa cancelar aluguel pago ou aguardando, antes da retirada", () => {
    expect(podeCancelar(pedido({}), HOJE, AGORA).pode).toBe(true);
    expect(
      podeCancelar(pedido({ status: "aguardando_pagamento", guardadoAte: "2026-11-03T13:00:00Z" }), HOJE, AGORA).pode,
    ).toBe(true);
  });
  it("não deixa cancelar pedido vencido, cancelado, concluído ou sem status", () => {
    expect(
      podeCancelar(pedido({ status: "aguardando_pagamento", guardadoAte: "2026-11-03T11:00:00Z" }), HOJE, AGORA).pode,
    ).toBe(false);
    expect(podeCancelar(pedido({ status: "cancelado" }), HOJE, AGORA).pode).toBe(false);
    expect(podeCancelar(pedido({ status: "concluido" }), HOJE, AGORA).pode).toBe(false);
    expect(podeCancelar(pedido({ status: undefined }), HOJE, AGORA).pode).toBe(false);
  });
  it("pedido com compra só pelo WhatsApp", () => {
    expect(podeCancelar(pedido({ itens: [aluguel("2026-12-05"), compra] }), HOJE, AGORA).pode).toBe(false);
  });
  it("não deixa depois da retirada", () => {
    // festa no sábado 7/11: retirada na sexta 6/11
    expect(podeCancelar(pedido({ itens: [aluguel("2026-11-07")] }), "2026-11-06", AGORA).pode).toBe(false);
    expect(podeCancelar(pedido({ itens: [aluguel("2026-11-07")] }), "2026-11-05", AGORA).pode).toBe(true);
  });
});

describe("creditoDoCancelamento", () => {
  it("sinal pago (incluindo o que foi pago com crédito) vira crédito", () => {
    expect(creditoDoCancelamento({ status: "pago", pagoAgora: 25, creditoUsado: 50 })).toBe(75);
    expect(creditoDoCancelamento({ status: "pago", pagoAgora: 75 })).toBe(75);
  });
  it("sem sinal pago, não há crédito", () => {
    expect(creditoDoCancelamento({ status: "aguardando_pagamento", pagoAgora: 75 })).toBe(0);
  });
});

describe("creditoNoPedido", () => {
  it("usa no máximo o valor do sinal", () => {
    expect(creditoNoPedido(75, 50)).toBe(50);
    expect(creditoNoPedido(75, 200)).toBe(75);
    expect(creditoNoPedido(75, 0)).toBe(0);
  });
});

describe("reservasSemOItem", () => {
  it("tira só as peças do próprio aluguel, na data dele", () => {
    const item = aluguel("2026-12-05", { topo: { codigo: "TOPO_1", nome: "Topo", preco: 20 } });
    const reservas = [
      { codigo: "SAFARI_001", festa: "2026-12-05" },
      { codigo: "TOPO_1", festa: "2026-12-05" },
      { codigo: "SAFARI_001", festa: "2026-12-19" },
      { codigo: "CIRCO_001", festa: "2026-12-05" },
    ];
    expect(reservasSemOItem(reservas, item)).toEqual([
      { codigo: "SAFARI_001", festa: "2026-12-19" },
      { codigo: "CIRCO_001", festa: "2026-12-05" },
    ]);
  });
});

describe("mensagemDeErroDaAlteracao", () => {
  it("explica cada recusa do banco", () => {
    expect(mensagemDeErroDaAlteracao("PECA_RESERVADA:SAFARI_001", aluguel("2026-12-05"))).toContain("Safari");
    expect(mensagemDeErroDaAlteracao("PRAZO_ADIAMENTO")).toContain("15 dias");
    expect(mensagemDeErroDaAlteracao("CANCELAR_COMPRA")).toContain("WhatsApp");
    expect(mensagemDeErroDaAlteracao("Failed to fetch")).toContain("internet");
  });
});
