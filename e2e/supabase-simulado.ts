import type { Page } from "@playwright/test";

// Imita as respostas do Supabase. Assim os testes não dependem da internet
// e não criam pedidos de mentira no banco de verdade.
export type Simulacao = {
  reservas?: { codigo: string; festa: string }[];
  vendidos?: string[];
  // o que a função criar_pedido responde: sucesso ou um erro do banco
  respostaDoPedido?: { numero: string } | { erro: string };
};

export async function simularSupabase(page: Page, simulacao: Simulacao = {}) {
  const pedidosEnviados: unknown[] = [];

  await page.route(/supabase\.co\//, async (rota) => {
    const caminho = new URL(rota.request().url()).pathname;

    if (caminho === "/rest/v1/reservas") return rota.fulfill({ json: simulacao.reservas ?? [] });
    if (caminho === "/rest/v1/vendas") {
      return rota.fulfill({ json: (simulacao.vendidos ?? []).map((codigo) => ({ codigo })) });
    }
    if (caminho === "/rest/v1/rpc/criar_pedido") {
      pedidosEnviados.push(rota.request().postDataJSON());
      const resposta = simulacao.respostaDoPedido ?? { numero: "ATL-1001" };
      if ("erro" in resposta) {
        return rota.fulfill({ status: 400, json: { code: "P0001", message: resposta.erro } });
      }
      const guardadoAte = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      return rota.fulfill({ json: { numero: resposta.numero, guardadoAte } });
    }
    return rota.fulfill({ json: [] });
  });

  return { pedidosEnviados };
}
