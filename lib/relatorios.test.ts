import { describe, expect, it } from "vitest";
import { faturamentoPorMes, festasPorDiaDaSemana, nomeDoMesCurto, rankingDeBolos } from "./relatorios";
import type { ItemAluguel, ItemCompra } from "@/types/carrinho";

const aluguel = (festa: string, preco: number, topo = 0): ItemAluguel => ({
  tipo: "aluguel",
  codigoBolo: "SAFARI_001",
  codigoOpcao: "S",
  nome: "Safari",
  festa,
  precoOpcao: preco,
  topo: topo ? { codigo: "TOPO_001", nome: "Coroa", preco: topo } : null,
  base: null,
  personalizacao: null,
});
const compra = (preco: number): ItemCompra => ({
  tipo: "compra",
  codigoBolo: "CIRCO_001",
  codigoOpcao: "C",
  nome: "Circo",
  preco,
  personalizacao: null,
});

describe("faturamentoPorMes", () => {
  it("aluguel conta no mês da festa, compra no mês do pedido", () => {
    const pedidos = [
      { criadoEm: "2026-10-20T10:00:00Z", itens: [aluguel("2026-11-21", 150, 30), compra(400)] },
      { criadoEm: "2026-11-02T10:00:00Z", itens: [aluguel("2026-11-28", 180)] },
    ];
    expect(faturamentoPorMes(pedidos)).toEqual([
      { mes: "2026-10", aluguel: 0, venda: 400 },
      { mes: "2026-11", aluguel: 360, venda: 0 },
    ]);
    expect(nomeDoMesCurto("2026-11")).toBe("nov/26");
  });
});

describe("rankingDeBolos e festasPorDiaDaSemana", () => {
  const reservas = [
    { codigo: "SAFARI_001", festa: "2026-11-21", origem: "site" as const }, // sábado
    { codigo: "SAFARI_001", festa: "2026-11-28", origem: "whatsapp" as const }, // sábado
    { codigo: "JARDIM_001", festa: "2026-11-22", origem: "site" as const }, // domingo
    { codigo: "TOPO_001", festa: "2026-11-21", origem: "site" as const }, // topo: não conta
  ];
  const acervo = ["SAFARI_001", "JARDIM_001", "CIRCO_001"];

  it("ordena do mais para o menos alugado, com quem nunca saiu no fim", () => {
    expect(rankingDeBolos(reservas, acervo)).toEqual([
      { codigo: "SAFARI_001", alugueis: 2 },
      { codigo: "JARDIM_001", alugueis: 1 },
      { codigo: "CIRCO_001", alugueis: 0 },
    ]);
  });

  it("conta as festas por dia da semana, só de bolos", () => {
    const dias = festasPorDiaDaSemana(reservas, acervo);
    expect(dias.find((d) => d.dia === "Sábado")?.festas).toBe(2);
    expect(dias.find((d) => d.dia === "Domingo")?.festas).toBe(1);
  });
});
