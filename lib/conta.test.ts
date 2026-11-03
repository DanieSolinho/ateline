import { describe, expect, it } from "vitest";
import { dadosMaisRecentes, historico, proximaRetirada, situacaoDoItem, situacaoDoPedido } from "./conta";
import type { ItemAluguel, ItemCompra } from "@/types/carrinho";
import type { Pedido } from "@/types/pedido";

// Festa no sábado 31/10/2026 → retirada sexta 30/10 → devolução terça 03/11
const aluguel = (festa: string): ItemAluguel => ({
  tipo: "aluguel",
  codigoBolo: "SAFARI_001",
  codigoOpcao: "SAFARI_001_3A",
  nome: "Safari · 3 andares",
  festa,
  precoOpcao: 150,
  topo: null,
  base: null,
  personalizacao: null,
});

const compra: ItemCompra = {
  tipo: "compra",
  codigoBolo: "JARDIM_001",
  codigoOpcao: "JARDIM_001_FLORES_3A",
  nome: "Jardim · 3 andares",
  preco: 420,
  personalizacao: null,
};

const pedido = (numero: string, criadoEm: string, itens: Pedido["itens"]) =>
  ({ numero, criadoEm, itens, cliente: {}, pagoAgora: 0, naRetirada: 0, restanteCompra: 0 }) as unknown as Pedido;

describe("situacaoDoItem", () => {
  const item = aluguel("2026-10-31");

  it("segue as datas do aluguel", () => {
    expect(situacaoDoItem(item, "2026-10-24")).toBe("reservado");
    expect(situacaoDoItem(item, "2026-10-30")).toBe("com-voce");
    expect(situacaoDoItem(item, "2026-11-03")).toBe("devolucao");
    expect(situacaoDoItem(item, "2026-11-04")).toBe("concluido");
  });

  it("compra fica com o sinal pago", () => {
    expect(situacaoDoItem(compra, "2026-10-24")).toBe("sinal-pago");
  });
});

describe("proximaRetirada", () => {
  const pedidos = [
    pedido("ATL-1", "2026-10-01T10:00:00Z", [aluguel("2026-11-14")]),
    pedido("ATL-2", "2026-10-02T10:00:00Z", [aluguel("2026-10-31"), compra]),
    pedido("ATL-3", "2026-09-01T10:00:00Z", [aluguel("2026-09-12")]),
  ];

  it("pega a retirada mais próxima a partir de hoje", () => {
    const proxima = proximaRetirada(pedidos, "2026-10-24");
    expect(proxima?.pedido.numero).toBe("ATL-2");
    expect(proxima?.periodo.retirada).toBe("2026-10-30");
  });

  it("sem aluguel pela frente, devolve null", () => {
    expect(proximaRetirada(pedidos, "2026-12-01")).toBeNull();
  });
});

describe("historico", () => {
  it("uma linha por item, da data mais recente para a mais antiga", () => {
    const linhas = historico(
      [pedido("ATL-1", "2026-10-20T10:00:00Z", [aluguel("2026-11-14"), compra])],
      "2026-10-24",
    );
    expect(linhas.map((linha) => [linha.data, linha.item.tipo])).toEqual([
      ["2026-11-14", "aluguel"],
      ["2026-10-20", "compra"],
    ]);
  });
});

describe("dadosMaisRecentes", () => {
  it("usa os dados do último pedido, sem perder a chave Pix de um aluguel anterior", () => {
    const comPix = { ...pedido("ATL-1", "", []), cliente: { nome: "Maria", email: "a@a.com", chavePix: "a@a.com" } };
    const semPix = { ...pedido("ATL-2", "", []), cliente: { nome: "Maria Silva", email: "b@b.com" } };
    expect(dadosMaisRecentes([comPix, semPix] as Pedido[])).toEqual({
      nome: "Maria Silva",
      email: "b@b.com",
      chavePix: "a@a.com",
    });
    expect(dadosMaisRecentes([])).toBeNull();
  });

  it("o endereço vem inteiro do último pedido com endereço", () => {
    const antigo = { ...pedido("ATL-1", "", []), cliente: { nome: "Maria", email: "a@a.com", cep: "20000000", rua: "Rua A", numero: "1", complemento: "casa 2", bairro: "Tijuca", cidade: "Rio", uf: "RJ" } };
    const novo = { ...pedido("ATL-2", "", []), cliente: { nome: "Maria", email: "a@a.com", cep: "21321000", rua: "Rua B", numero: "5", bairro: "Centro", cidade: "Rio", uf: "RJ" } };
    const semEndereco = { ...pedido("ATL-3", "", []), cliente: { nome: "Maria", email: "a@a.com" } };
    const dados = dadosMaisRecentes([antigo, novo, semEndereco] as Pedido[]);
    expect(dados?.rua).toBe("Rua B");
    expect(dados?.complemento).toBeUndefined(); // não herda o "casa 2" do endereço antigo
  });
});

describe("situacaoDoPedido", () => {
  const agora = "2026-10-26T18:00:00.000Z";

  it("aguardando sinal, prazo vencido e cancelado vêm do status do banco", () => {
    expect(situacaoDoPedido({ status: "aguardando_pagamento", guardadoAte: "2026-10-26T19:00:00.000Z" }, agora)).toBe(
      "aguardando",
    );
    expect(situacaoDoPedido({ status: "aguardando_pagamento", guardadoAte: "2026-10-26T17:00:00.000Z" }, agora)).toBe(
      "vencido",
    );
    expect(situacaoDoPedido({ status: "cancelado" }, agora)).toBe("cancelado");
  });

  it("pago ou pedido antigo segue pelas datas", () => {
    expect(situacaoDoPedido({ status: "pago" }, agora)).toBeNull();
    expect(situacaoDoPedido({}, agora)).toBeNull();
  });

  it("pedido vencido não aparece como próxima retirada", () => {
    const vencido = { ...pedido("ATL-9", "2026-10-26T10:00:00Z", [aluguel("2026-11-14")]), status: "aguardando_pagamento" as const, guardadoAte: "2026-10-26T12:00:00Z" };
    expect(proximaRetirada([vencido], "2026-10-26", agora)).toBeNull();
  });
});
