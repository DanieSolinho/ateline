import { totalDoItem } from "@/lib/carrinho";
import type { ItemCarrinho } from "@/types/carrinho";

// Dados que vêm do banco (função dados_do_relatorio)
export type DadosDoRelatorio = {
  reservas: { codigo: string; festa: string; origem: "site" | "whatsapp" }[];
  pedidos: { criadoEm: string; itens: ItemCarrinho[] }[];
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// "2026-11" → "nov/26"
export function nomeDoMesCurto(anoMes: string): string {
  const [ano, mes] = anoMes.split("-");
  return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`;
}

// Faturamento dos pedidos pagos, por mês: aluguel pelo mês da festa, compra pelo mês do pedido.
// Só pedidos do site (as reservas do WhatsApp não têm valor no sistema).
export function faturamentoPorMes(pedidos: DadosDoRelatorio["pedidos"]): { mes: string; aluguel: number; venda: number }[] {
  const meses = new Map<string, { aluguel: number; venda: number }>();
  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      const mes = (item.tipo === "aluguel" ? item.festa : pedido.criadoEm).slice(0, 7);
      const atual = meses.get(mes) ?? { aluguel: 0, venda: 0 };
      if (item.tipo === "aluguel") atual.aluguel += totalDoItem(item);
      else atual.venda += totalDoItem(item);
      meses.set(mes, atual);
    }
  }
  return [...meses.entries()].map(([mes, valores]) => ({ mes, ...valores })).sort((a, b) => a.mes.localeCompare(b.mes));
}

// Quantas vezes cada bolo foi alugado (site + WhatsApp), do mais para o menos alugado.
// Bolos do acervo que nunca saíram entram com zero, no fim.
export function rankingDeBolos(
  reservas: DadosDoRelatorio["reservas"],
  bolosDoAcervo: string[],
): { codigo: string; alugueis: number }[] {
  const contagem = new Map(bolosDoAcervo.map((codigo) => [codigo, 0]));
  for (const reserva of reservas) {
    if (contagem.has(reserva.codigo)) contagem.set(reserva.codigo, (contagem.get(reserva.codigo) ?? 0) + 1);
  }
  return [...contagem.entries()]
    .map(([codigo, alugueis]) => ({ codigo, alugueis }))
    .sort((a, b) => b.alugueis - a.alugueis || a.codigo.localeCompare(b.codigo));
}

// Em que dia da semana caem as festas (só bolos, cada aluguel conta uma vez)
export function festasPorDiaDaSemana(
  reservas: DadosDoRelatorio["reservas"],
  bolosDoAcervo: string[],
): { dia: string; festas: number }[] {
  const contagem = DIAS.map((dia) => ({ dia, festas: 0 }));
  for (const reserva of reservas) {
    if (!bolosDoAcervo.includes(reserva.codigo)) continue;
    contagem[new Date(`${reserva.festa}T00:00:00Z`).getUTCDay()].festas++;
  }
  return contagem;
}
