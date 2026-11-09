import { formatarCep } from "@/lib/cep";
import { diaPorExtenso } from "@/lib/calendario";
import { calcularPeriodo } from "@/lib/periodo";
import type { Pedido } from "@/types/pedido";

// O frete vai por transportadora e o valor é orçado pela loja no WhatsApp.
// Esta é a mensagem que a cliente manda, já com tudo o que a loja precisa para cotar.
function enderecoDoPedido(pedido: Pedido): string[] {
  const { cliente } = pedido;
  return [
    `${cliente.rua}, ${cliente.numero}${cliente.complemento ? ` (${cliente.complemento})` : ""}`,
    `${cliente.bairro} · ${cliente.cidade}/${cliente.uf}`,
    `CEP ${formatarCep(cliente.cep ?? "")}`,
  ];
}

export function mensagemOrcamentoFrete(pedido: Pedido): string {
  const { cliente } = pedido;
  const compras = pedido.itens.filter((item) => item.tipo === "compra");
  const endereco = enderecoDoPedido(pedido);

  return [
    `Olá! Fiz o pedido ${pedido.numero} pelo site e quero o orçamento do frete pela transportadora.`,
    "",
    ...compras.map((item) => `• ${item.nome} (${item.codigoBolo})`),
    "",
    "Endereço de entrega:",
    ...endereco,
    "",
    `Nome: ${cliente.nome}`,
  ].join("\n");
}

// Aluguel com entrega: a loja entrega só em alguns lugares. A reserva já está feita;
// a cliente manda esta mensagem para saber se a loja atende o bairro e quanto custa.
export function mensagemEntregaAluguel(pedido: Pedido): string {
  const alugueis = pedido.itens.filter((item) => item.tipo === "aluguel");
  return [
    `Olá! Fiz a reserva ${pedido.numero} pelo site e quero a entrega no endereço. Vocês entregam no meu bairro? Qual o valor? (Sei que, se não entregarem, retiro na loja.)`,
    "",
    ...alugueis.map(
      (item) =>
        `• ${item.nome}: festa ${diaPorExtenso(item.festa)}, entrega ${diaPorExtenso(calcularPeriodo(item.festa).retirada)}`,
    ),
    "",
    "Endereço:",
    ...enderecoDoPedido(pedido),
    "",
    `Nome: ${pedido.cliente.nome}`,
  ].join("\n");
}
