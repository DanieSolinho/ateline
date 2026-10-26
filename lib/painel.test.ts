import { describe, expect, it } from "vitest";
import {
  agruparReservas,
  calcularDevolucao,
  diasDeAtraso,
  receberNaRetirada,
  separarAgenda,
  type ReservaDaAgenda,
} from "./painel";
import type { ItemAluguel } from "@/types/carrinho";

const item: ItemAluguel = {
  tipo: "aluguel",
  codigoBolo: "JARDIM_001",
  codigoOpcao: "JARDIM_001_3A",
  nome: "Jardim · 3 andares",
  festa: "2026-11-21",
  precoOpcao: 140,
  topo: { codigo: "TOPO_001", nome: "Coroa", preco: 30 },
  base: null,
  personalizacao: null,
};

const reserva = (id: number, codigo: string, extra: Partial<ReservaDaAgenda> = {}): ReservaDaAgenda => ({
  id,
  codigo,
  festa: "2026-11-21",
  retirada: "2026-11-20",
  devolucao: "2026-11-24",
  origem: "site",
  retiradoEm: null,
  devolvidoEm: null,
  taxaDevolvida: null,
  pedido: { id: "p1", numero: "ATL-1001", status: "pago", nome: "Maria", whatsapp: "21987654321", chavePix: "m@x.com", itens: [item] },
  ...extra,
});

describe("calcularDevolucao (exemplo do contrato)", () => {
  it("1 dia de atraso em R$ 70 e vela não devolvida: devolve R$ 19", () => {
    const conta = calcularDevolucao({ taxa: 50, valorLocacao: 70, diasAtraso: 1, semAvarias: true, temVela: true, velaDevolvida: false });
    expect(conta).toMatchObject({ multa: 21, descontoVela: 10, devolver: 19, faltaCobrar: 0 });
  });

  it("tudo certo: devolve a taxa inteira", () => {
    expect(calcularDevolucao({ taxa: 50, valorLocacao: 170, diasAtraso: 0, semAvarias: true, temVela: false, velaDevolvida: false }).devolver).toBe(50);
  });

  it("avaria: não devolve nada", () => {
    expect(calcularDevolucao({ taxa: 50, valorLocacao: 70, diasAtraso: 0, semAvarias: false, temVela: false, velaDevolvida: false })).toMatchObject({ devolver: 0, motivo: "avaria" });
  });

  it("multa maior que a taxa: mostra quanto falta cobrar", () => {
    expect(calcularDevolucao({ taxa: 50, valorLocacao: 170, diasAtraso: 2, semAvarias: true, temVela: false, velaDevolvida: false })).toMatchObject({ multa: 102, devolver: 0, faltaCobrar: 52 });
  });
});

describe("agenda", () => {
  it("bolo e topo do mesmo pedido viram um cartão só", () => {
    const grupos = agruparReservas([reserva(1, "JARDIM_001"), reserva(2, "TOPO_001")]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0]).toMatchObject({ ids: [1, 2], codigos: ["JARDIM_001", "TOPO_001"], item: { nome: "Jardim · 3 andares" } });
  });

  it("reservas do WhatsApp ficam separadas", () => {
    const grupos = agruparReservas([reserva(1, "SAFARI_001", { pedido: null, origem: "whatsapp" }), reserva(2, "TOPO_003", { pedido: null })]);
    expect(grupos).toHaveLength(2);
  });

  it("separa o que sai, o que volta e o que está atrasado", () => {
    const grupos = agruparReservas([reserva(1, "JARDIM_001", { retiradoEm: "2026-11-20T15:00:00Z" })]);
    expect(separarAgenda(grupos, "2026-11-20").saem).toHaveLength(1);
    expect(separarAgenda(grupos, "2026-11-24").voltam).toHaveLength(1);
    expect(separarAgenda(grupos, "2026-11-26").atrasados).toHaveLength(1);
  });

  it("dias de atraso e valor a receber na retirada", () => {
    expect(diasDeAtraso("2026-11-24", "2026-11-24")).toBe(0);
    expect(diasDeAtraso("2026-11-24", "2026-11-26")).toBe(2);
    // locação 140 + topo 30 = 170 → metade 85 + taxa 50
    expect(receberNaRetirada(item, 50)).toBe(135);
  });
});
