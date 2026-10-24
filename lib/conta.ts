import { calcularPeriodo } from "@/lib/periodo";
import type { ItemAluguel, ItemCarrinho } from "@/types/carrinho";
import type { Periodo } from "@/types/reserva";
import type { DadosCheckout } from "@/lib/checkout";
import type { Pedido } from "@/types/pedido";

export type Situacao = "reservado" | "com-voce" | "devolucao" | "concluido" | "sinal-pago";

export const NOME_DA_SITUACAO: Record<Situacao, string> = {
  reservado: "Reservado",
  "com-voce": "Com você",
  devolucao: "Devolver hoje",
  concluido: "Concluído",
  "sinal-pago": "Sinal pago",
};

// A situação de cada item, olhando só as datas (sem back-end, não sabemos se já foi pago ou devolvido)
export function situacaoDoItem(item: ItemCarrinho, hoje: string): Situacao {
  if (item.tipo === "compra") return "sinal-pago";
  const periodo = calcularPeriodo(item.festa);
  if (hoje < periodo.retirada) return "reservado";
  if (hoje < periodo.devolucao) return "com-voce";
  if (hoje === periodo.devolucao) return "devolucao";
  return "concluido";
}

export type ProximaRetirada = { pedido: Pedido; item: ItemAluguel; periodo: Periodo };

// O aluguel com a retirada mais próxima, de hoje em diante
export function proximaRetirada(pedidos: Pedido[], hoje: string): ProximaRetirada | null {
  const futuras = pedidos.flatMap((pedido) =>
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
export function historico(pedidos: Pedido[], hoje: string): LinhaDoHistorico[] {
  return pedidos
    .flatMap((pedido) =>
      pedido.itens.map((item, indice) => ({
        chave: `${pedido.numero}-${indice}`,
        numero: pedido.numero,
        data: item.tipo === "aluguel" ? item.festa : pedido.criadoEm.slice(0, 10),
        item,
        situacao: situacaoDoItem(item, hoje),
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
