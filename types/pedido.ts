import type { DadosCheckout } from "@/lib/checkout";
import type { ItemCarrinho } from "@/types/carrinho";

export type StatusDoPedido = "aguardando_pagamento" | "pago" | "cancelado" | "concluido";

export type Pedido = {
  numero: string;
  criadoEm: string; // data e hora do pedido (e do aceite do contrato, se tiver aluguel)
  cliente: DadosCheckout;
  itens: ItemCarrinho[];
  pagoAgora: number; // sinal de 50% dos aluguéis e das compras
  naRetirada: number; // restante dos aluguéis + taxas de segurança
  restanteCompra: number; // os outros 50% da compra, antes do envio ou na retirada (frete à parte)
  // Vêm do banco. Pedidos antigos, guardados só no navegador, não têm.
  status?: StatusDoPedido;
  guardadoAte?: string | null; // até quando as peças ficam guardadas esperando o sinal
};
