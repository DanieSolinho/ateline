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

// ---------------------------------------------------------------------
// Clientes e visualizações (função dados_de_clientes_e_visualizacoes)
// ---------------------------------------------------------------------
export type DadosDeClientes = {
  clientes: { cliente: string; primeiroPedido: string; pedidos: number }[];
  visualizacoes: { codigo: string; ultimos30: number | null; anteriores30: number | null }[];
};

// "2026-11-04" → "2026-10" (o mês anterior)
function mesAnterior(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 2, 1));
  return data.toISOString().slice(0, 7);
}

// Quantas clientes, quantas novas (primeiro pedido pago no mês) e quantas voltaram
export function resumoDeClientes(clientes: DadosDeClientes["clientes"], hoje: string) {
  const esteMes = hoje.slice(0, 7);
  const passado = mesAnterior(esteMes);
  const meses: string[] = [esteMes];
  while (meses.length < 6) meses.unshift(mesAnterior(meses[0]));

  const novosPorMes = meses.map((mes) => ({
    mes,
    novos: clientes.filter((c) => c.primeiroPedido.slice(0, 7) === mes).length,
  }));
  return {
    total: clientes.length,
    novosEsteMes: novosPorMes.at(-1)!.novos,
    novosMesPassado: clientes.filter((c) => c.primeiroPedido.slice(0, 7) === passado).length,
    voltaram: clientes.filter((c) => c.pedidos > 1).length,
    novosPorMes,
  };
}

// Variação em relação ao período anterior: "+25%", "-10%", "novo" ou "igual"
export function variacao(atual: number, anterior: number): string {
  if (anterior === 0) return atual > 0 ? "novo" : "igual";
  const percentual = Math.round(((atual - anterior) / anterior) * 100);
  if (percentual === 0) return "igual";
  return `${percentual > 0 ? "+" : ""}${percentual}%`;
}

// Bolos mais vistos nos últimos 30 dias, com a tendência e quantas vezes foram alugados (12 meses)
export function bolosMaisVistos(
  visualizacoes: DadosDeClientes["visualizacoes"],
  alugueisPorBolo: Map<string, number>,
  limite = 10,
) {
  return visualizacoes
    .map((v) => ({
      codigo: v.codigo,
      vistas: v.ultimos30 ?? 0,
      anteriores: v.anteriores30 ?? 0,
      alugueis: alugueisPorBolo.get(v.codigo) ?? 0,
    }))
    .filter((v) => v.vistas > 0)
    .sort((a, b) => b.vistas - a.vistas || a.codigo.localeCompare(b.codigo))
    .slice(0, limite);
}

// Muito vistos e nunca alugados: sinal de que a foto, o preço ou a descrição podem estar afastando
export function vistosSemAluguel(maisVistos: ReturnType<typeof bolosMaisVistos>, minimoDeVistas = 10) {
  return maisVistos.filter((v) => v.vistas >= minimoDeVistas && v.alugueis === 0);
}
