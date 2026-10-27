import { supabase } from "@/lib/supabase";
import type { DadosCheckout } from "@/lib/checkout";
import type { ItemCarrinho } from "@/types/carrinho";
import type { Pedido, StatusDoPedido } from "@/types/pedido";

export type PedidoParaEnviar = Omit<Pedido, "numero" | "criadoEm" | "status" | "guardadoAte">;

export type ResultadoDoPedido =
  | { ok: true; numero: string; guardadoAte: string | null }
  | { ok: false; mensagem: string };

// Transforma o erro do banco numa frase que a cliente entende
export function mensagemDeErroDoPedido(erro: string, itens: ItemCarrinho[]): string {
  const ocupada = erro.match(/PECA_RESERVADA:([A-Z0-9_]+)/)?.[1];
  if (ocupada) {
    for (const item of itens) {
      if (item.tipo !== "aluguel") continue;
      if (item.codigoBolo === ocupada) {
        return `O bolo ${item.nome} acabou de ser reservado por outra pessoa nessa data. Volte ao bolo e escolha outra data.`;
      }
      if (item.topo?.codigo === ocupada) {
        return `O topo ${item.topo.nome} acabou de ser reservado nessa data. Volte ao bolo e escolha outro topo.`;
      }
      if (item.base?.codigo === ocupada) {
        return "A base dourada acabou de ser reservada nessa data. Volte ao bolo e tente de novo sem a base.";
      }
    }
    return "Uma das peças acabou de ser reservada por outra pessoa. Volte ao bolo e escolha outra data.";
  }
  if (erro.includes("PRECO_DESATUALIZADO")) {
    return "Os preços foram atualizados enquanto a página estava aberta. Recarregue a página e confira o carrinho.";
  }
  if (erro.includes("ITEM_INDISPONIVEL")) {
    return "Um dos itens do carrinho não está mais disponível. Remova-o e escolha outro.";
  }
  if (erro.includes("DATA_INVALIDA")) return "A data da festa já passou. Volte ao bolo e escolha outra data.";
  if (erro.includes("PEDIDO_VAZIO")) return "Seu pedido está vazio.";
  return "Não conseguimos registrar seu pedido agora. Confira sua internet e tente de novo.";
}

// Manda o pedido para o banco, que confere a agenda e reserva as peças de uma vez
export async function enviarPedido(pedido: PedidoParaEnviar): Promise<ResultadoDoPedido> {
  const { data, error } = await supabase.rpc("criar_pedido", { pedido });
  if (error) {
    console.warn("Pedido recusado:", error.message);
    return { ok: false, mensagem: mensagemDeErroDoPedido(error.message, pedido.itens) };
  }
  const resposta = data as { numero: string; guardadoAte: string | null };
  return { ok: true, numero: resposta.numero, guardadoAte: resposta.guardadoAte };
}

// Uma linha da tabela "pedidos" do Supabase
export type LinhaDePedido = {
  numero: string;
  status: StatusDoPedido;
  criado_em: string;
  guardado_ate: string | null;
  cliente: DadosCheckout;
  itens: ItemCarrinho[];
  pago_agora: number;
  na_retirada: number;
  restante_compra: number;
};

export function pedidoDaLinha(linha: LinhaDePedido): Pedido {
  return {
    numero: linha.numero,
    status: linha.status,
    criadoEm: linha.criado_em,
    guardadoAte: linha.guardado_ate,
    cliente: linha.cliente,
    itens: linha.itens,
    pagoAgora: Number(linha.pago_agora),
    naRetirada: Number(linha.na_retirada),
    restanteCompra: Number(linha.restante_compra),
  };
}

// Os pedidos da cliente logada (o banco só devolve os dela)
export async function buscarMeusPedidos(): Promise<Pedido[] | null> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("numero, status, criado_em, guardado_ate, cliente, itens, pago_agora, na_retirada, restante_compra")
    .order("criado_em");
  if (error) {
    console.warn("Não deu para buscar os pedidos:", error.message);
    return null;
  }
  return (data as LinhaDePedido[]).map(pedidoDaLinha);
}

// Mensagem pronta para a cliente pagar o sinal pelo WhatsApp (até o Mercado Pago entrar)
export function mensagemDoSinal(pedido: Pick<Pedido, "numero" | "cliente">, valor: string): string {
  const forma = pedido.cliente.pagamento === "cartao" ? "no cartão. Pode me mandar o link?" : "por Pix.";
  return `Olá! Fiz o pedido ${pedido.numero} pelo site e quero pagar o sinal de ${valor} ${forma}`;
}
