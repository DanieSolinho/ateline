import { supabase } from "@/lib/supabase";
import { calcularPeriodo } from "@/lib/periodo";
import { situacaoDoPedido } from "@/lib/conta";
import { ANTECEDENCIA_ADIAMENTO_DIAS } from "@/lib/regras";
import type { ItemAluguel } from "@/types/carrinho";
import type { Pedido } from "@/types/pedido";
import type { Reserva } from "@/types/reserva";

// Quantos dias faltam de "hoje" até "dia" (as duas em "AAAA-MM-DD")
export function diasAte(hoje: string, dia: string): number {
  return Math.round((Date.parse(`${dia}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86_400_000);
}

export type Permissao = { pode: true } | { pode: false; motivo: string };

// Adiamento pelo site: sinal pago e pelo menos 15 dias até a festa (as mesmas regras do banco)
export function podeAdiar(pedido: Pick<Pedido, "status">, item: ItemAluguel, hoje: string): Permissao {
  if (pedido.status !== "pago") {
    return { pode: false, motivo: "O adiamento fica disponível depois que o sinal for pago." };
  }
  if (diasAte(hoje, item.festa) < ANTECEDENCIA_ADIAMENTO_DIAS) {
    return {
      pode: false,
      motivo: `Faltam menos de ${ANTECEDENCIA_ADIAMENTO_DIAS} dias para a festa. Para mudar a data agora, fale com a loja.`,
    };
  }
  return { pode: true };
}

// Cancelamento pelo site: só aluguel, antes da retirada, e com o pedido ainda valendo
export function podeCancelar(pedido: Pedido, hoje: string, agora: string): Permissao {
  const situacao = situacaoDoPedido(pedido, agora);
  if (situacao === "cancelado" || situacao === "vencido" || pedido.status === "concluido" || !pedido.status) {
    return { pode: false, motivo: "Este pedido não pode mais ser cancelado." };
  }
  if (pedido.itens.some((item) => item.tipo === "compra")) {
    return { pode: false, motivo: "Pedidos com compra são cancelados pelo WhatsApp." };
  }
  const jaRetirado = pedido.itens.some(
    (item) => item.tipo === "aluguel" && calcularPeriodo(item.festa).retirada <= hoje,
  );
  if (jaRetirado) return { pode: false, motivo: "A retirada já aconteceu." };
  return { pode: true };
}

// Valor que vira crédito se a cliente cancelar agora (0 se o sinal ainda não foi pago)
export function creditoDoCancelamento(pedido: Pick<Pedido, "status" | "pagoAgora" | "creditoUsado">): number {
  return pedido.status === "pago" ? pedido.pagoAgora + (pedido.creditoUsado ?? 0) : 0;
}

// A agenda sem as peças do próprio aluguel, para o calendário do adiamento não mostrar a data atual como ocupada
export function reservasSemOItem(reservas: Reserva[], item: ItemAluguel): Reserva[] {
  const pecas = [item.codigoBolo, item.topo?.codigo, item.base?.codigo].filter(Boolean) as string[];
  const restantes = [...reservas];
  for (const peca of pecas) {
    const indice = restantes.findIndex((reserva) => reserva.codigo === peca && reserva.festa === item.festa);
    if (indice >= 0) restantes.splice(indice, 1);
  }
  return restantes;
}

// Transforma o erro do banco numa frase que a cliente entende
export function mensagemDeErroDaAlteracao(erro: string, item?: ItemAluguel): string {
  if (erro.includes("PECA_RESERVADA")) {
    return `${item ? `O bolo ${item.nome}` : "Uma das peças"} já está reservado nessa data. Escolha outro dia.`;
  }
  if (erro.includes("PRAZO_ADIAMENTO")) {
    return `O adiamento pelo site vale até ${ANTECEDENCIA_ADIAMENTO_DIAS} dias antes da festa. Fale com a loja pelo WhatsApp.`;
  }
  if (erro.includes("ADIAMENTO_SO_PAGO")) return "O adiamento fica disponível depois que o sinal for pago.";
  if (erro.includes("DATA_INVALIDA")) return "Escolha uma data futura, diferente da atual.";
  if (erro.includes("CANCELAR_COMPRA")) return "Pedidos com compra são cancelados pelo WhatsApp.";
  if (erro.includes("JA_RETIRADO")) return "A retirada já aconteceu, então o pedido não pode mais ser cancelado.";
  if (erro.includes("NAO_PODE_CANCELAR")) return "Este pedido não pode mais ser cancelado.";
  if (erro.includes("PEDIDO_NAO_ENCONTRADO")) return "Não encontramos este pedido na sua conta.";
  return "Não deu certo agora. Confira sua internet e tente de novo.";
}

export type ResultadoDaAlteracao = { ok: true; credito: number } | { ok: false; mensagem: string };

export async function adiarReserva(
  numero: string,
  indice: number,
  novaFesta: string,
  item: ItemAluguel,
): Promise<ResultadoDaAlteracao> {
  const { error } = await supabase.rpc("adiar_reserva", {
    numero_do_pedido: numero,
    indice_do_item: indice,
    nova_festa: novaFesta,
  });
  if (error) return { ok: false, mensagem: mensagemDeErroDaAlteracao(error.message, item) };
  return { ok: true, credito: 0 };
}

export async function cancelarMeuPedido(numero: string): Promise<ResultadoDaAlteracao> {
  const { data, error } = await supabase.rpc("cancelar_meu_pedido", { numero_do_pedido: numero });
  if (error) return { ok: false, mensagem: mensagemDeErroDaAlteracao(error.message) };
  return { ok: true, credito: Number(data) };
}
