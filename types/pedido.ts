import type { DadosCheckout } from "@/lib/checkout";
import type { ItemCarrinho } from "@/types/carrinho";

export type Pedido = {
  numero: string;
  criadoEm: string; // data e hora do aceite do contrato
  cliente: DadosCheckout;
  itens: ItemCarrinho[];
  sinal: number;
  naRetirada: number;
};