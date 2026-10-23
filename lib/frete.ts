import { formatarCep } from "@/lib/cep";
import type { Pedido } from "@/types/pedido";

// O frete vai por transportadora e o valor é orçado pela loja no WhatsApp.
// Esta é a mensagem que a cliente manda, já com tudo o que a loja precisa para cotar.
export function mensagemOrcamentoFrete(pedido: Pedido): string {
  const { cliente } = pedido;
  const compras = pedido.itens.filter((item) => item.tipo === "compra");
  const endereco = [
    `${cliente.rua}, ${cliente.numero}${cliente.complemento ? ` (${cliente.complemento})` : ""}`,
    `${cliente.bairro} · ${cliente.cidade}/${cliente.uf}`,
    `CEP ${formatarCep(cliente.cep ?? "")}`,
  ];

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
