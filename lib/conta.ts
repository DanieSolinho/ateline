import { calcularPeriodo } from "@/lib/periodo";
import type { ItemAluguel, ItemCarrinho } from "@/types/carrinho";
import type { Periodo } from "@/types/reserva";
import type { DadosCheckout } from "@/lib/checkout";
import type { Pedido } from "@/types/pedido";

export type Situacao =
  | "aguardando"
  | "vencido"
  | "cancelado"
  | "reservado"
  | "com-voce"
  | "devolucao"
  | "concluido"
  | "sinal-pago";

export const NOME_DA_SITUACAO: Record<Situacao, string> = {
  aguardando: "Aguardando sinal",
  vencido: "Prazo vencido",
  cancelado: "Cancelado",
  reservado: "Reservado",
  "com-voce": "Com você",
  devolucao: "Devolver hoje",
  concluido: "Concluído",
  "sinal-pago": "Sinal pago",
};

// O pedido ainda vale? Aguardando sinal com o prazo vencido não vale mais.
export function situacaoDoPedido(pedido: Pick<Pedido, "status" | "guardadoAte">, agora: string): Situacao | null {
  if (pedido.status === "cancelado") return "cancelado";
  if (pedido.status === "aguardando_pagamento") {
    return pedido.guardadoAte && pedido.guardadoAte < agora ? "vencido" : "aguardando";
  }
  return null; // pago, concluído ou pedido antigo do navegador: segue pelas datas
}

// A situação de cada item. Primeiro o status do pedido; depois, as datas do aluguel.
export function situacaoDoItem(item: ItemCarrinho, hoje: string, doPedido: Situacao | null = null): Situacao {
  if (doPedido) return doPedido;
  if (item.tipo === "compra") return "sinal-pago";
  const periodo = calcularPeriodo(item.festa);
  if (hoje < periodo.retirada) return "reservado";
  if (hoje < periodo.devolucao) return "com-voce";
  if (hoje === periodo.devolucao) return "devolucao";
  return "concluido";
}

export type ProximaRetirada = { pedido: Pedido; item: ItemAluguel; periodo: Periodo };

// O aluguel com a retirada mais próxima, de hoje em diante (sem os cancelados e vencidos)
export function proximaRetirada(pedidos: Pedido[], hoje: string, agora = `${hoje}T00:00:00Z`): ProximaRetirada | null {
  const valendo = pedidos.filter((pedido) => {
    const situacao = situacaoDoPedido(pedido, agora);
    return situacao !== "cancelado" && situacao !== "vencido";
  });
  const futuras = valendo.flatMap((pedido) =>
    pedido.itens
      .filter((item): item is ItemAluguel => item.tipo === "aluguel")
      .map((item) => ({ pedido, item, periodo: calcularPeriodo(item.festa) }))
      .filter(({ periodo }) => periodo.retirada >= hoje),
  );
  futuras.sort((a, b) => a.periodo.retirada.localeCompare(b.periodo.retirada));
  return futuras[0] ?? null;
}

export type LinhaDoHistorico = {
  chave: string;
  numero: string;
  data: string; // data da festa (aluguel) ou do pedido (compra), em "AAAA-MM-DD"
  item: ItemCarrinho;
  situacao: Situacao;
};

// Uma linha por item, do mais recente para o mais antigo
export function historico(pedidos: Pedido[], hoje: string, agora = `${hoje}T00:00:00Z`): LinhaDoHistorico[] {
  return pedidos
    .flatMap((pedido) =>
      pedido.itens.map((item, indice) => ({
        chave: `${pedido.numero}-${indice}`,
        numero: pedido.numero,
        data: item.tipo === "aluguel" ? item.festa : pedido.criadoEm.slice(0, 10),
        item,
        situacao: situacaoDoItem(item, hoje, situacaoDoPedido(pedido, agora)),
      })),
    )
    .sort((a, b) => b.data.localeCompare(a.data));
}

// Os dados pessoais mais recentes. Um pedido só de compra não tem chave Pix,
// então cada campo vem do último pedido que tiver esse campo preenchido.
export type DadosPessoais = Pick<DadosCheckout, "nome" | "cpf" | "whatsapp" | "email" | "chavePix">;

export function dadosMaisRecentes(pedidos: Pedido[]): DadosPessoais | null {
  if (pedidos.length === 0) return null;
  const dados: Partial<DadosPessoais> = {};
  for (const { cliente } of pedidos) {
    for (const campo of ["nome", "cpf", "whatsapp", "email", "chavePix"] as const) {
      if (cliente[campo]) dados[campo] = cliente[campo];
    }
  }
  return dados as DadosPessoais;
}
