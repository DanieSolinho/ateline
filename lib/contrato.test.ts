import { describe, expect, it } from "vitest";
import { dataEHoraNoRio, descricaoDoItem, enderecoDaCliente, montarContrato } from "@/lib/contrato";
import { textoParaPdf } from "@/lib/contratoPdf";
import type { ItemAluguel } from "@/types/carrinho";
import type { Pedido } from "@/types/pedido";

const safari: ItemAluguel = {
  tipo: "aluguel",
  codigoBolo: "SAFARI_001",
  codigoOpcao: "SAFARI_001_3A",
  nome: "Safari · 3 andares",
  festa: "2026-12-05",
  precoOpcao: 150,
  topo: { codigo: "TOPO_001", nome: "Coroa dourada", preco: 30 },
  base: { codigo: "BASE_DOURADA_001", nome: "Base dourada", preco: 40 },
  personalizacao: "Nome: Alice · Idade: 5",
};

const pedido: Pedido = {
  numero: "ATL-1001",
  criadoEm: "2026-11-02T22:30:00Z",
  cliente: {
    nome: "Maria Souza",
    cpf: "52998224725",
    whatsapp: "21987654321",
    email: "maria@x.com",
    pagamento: "pix",
    chavePix: "maria@x.com",
  } as Pedido["cliente"],
  itens: [safari],
  pagoAgora: 110,
  naRetirada: 160,
  restanteCompra: 0,
  status: "pago",
};

const texto = (p: Pedido) =>
  montarContrato(p)!
    .blocos.map((b) => b.texto)
    .join("\n");

describe("montarContrato", () => {
  it("leva os dados da cliente, das peças, das datas e dos valores", () => {
    const t = texto(pedido);
    expect(t).toContain("Maria Souza, CPF 529.982.247-25");
    expect(t).toContain("WhatsApp (21) 98765-4321");
    expect(t).toContain("Safari · 3 andares, com topo Coroa dourada e base dourada (Nome: Alice · Idade: 5)");
    expect(t).toContain("Retirada: sexta-feira, 04/12, a partir das 14h.");
    expect(t).toContain("Devolução: terça-feira, 08/12, a partir das 10h.");
    expect(textoParaPdf(t)).toContain("O valor da locação é de R$ 220,00.");
    expect(textoParaPdf(t)).toContain("Sinal pago na reserva: R$ 110,00");
    expect(textoParaPdf(t)).toContain("taxa de segurança, até o dia da retirada ou nele: R$ 160,00");
    expect(t).toContain("Pix na chave maria@x.com");
    expect(t).toContain("pedido ATL-1001");
  });

  it("o aceite fica no horário do Rio", () => {
    // 22:30 em UTC = 19:30 no Rio
    expect(dataEHoraNoRio("2026-11-02T22:30:00Z")).toEqual({ data: "02/11/2026", hora: "19:30" });
    expect(dataEHoraNoRio("2026-11-03T01:00:00Z").data).toBe("02/11/2026");
  });

  it("soma as taxas de cada bolo e ignora as compras", () => {
    const outro = { ...safari, codigoBolo: "CIRCO_001", nome: "Circo", topo: null, base: null, precoOpcao: 100 };
    const compra = { tipo: "compra" as const, codigoBolo: "X", codigoOpcao: "X", nome: "Jardim", preco: 400, personalizacao: null };
    const t = textoParaPdf(texto({ ...pedido, itens: [safari, outro, compra] }));
    expect(t).toContain("O valor da locação é de R$ 320,00.");
    expect(t).toContain("R$ 260,00"); // 160 de restante + 2 x 50 de taxa
    expect(t).not.toContain("Jardim");
  });

  it("pedido só de compra não tem contrato de locação", () => {
    const compra = { tipo: "compra" as const, codigoBolo: "X", codigoOpcao: "X", nome: "Jardim", preco: 400, personalizacao: null };
    expect(montarContrato({ ...pedido, itens: [compra] })).toBeNull();
  });

  it("dá nome ao arquivo com o número do pedido", () => {
    expect(montarContrato(pedido)!.nomeDoArquivo).toBe("Contrato-Ateline-ATL-1001.pdf");
  });
});

describe("enderecoDaCliente", () => {
  it("usa o endereço de entrega, depois o de envio", () => {
    expect(enderecoDaCliente({ ...pedido.cliente, endereco: "Rua A, 10, Tijuca" })).toBe("Rua A, 10, Tijuca");
    expect(
      enderecoDaCliente({ ...pedido.cliente, rua: "Rua B", numero: "5", bairro: "Centro", cidade: "Rio", uf: "rj", cep: "20000-000" }),
    ).toBe("Rua B, 5, Centro, Rio/RJ, CEP 20000-000");
    expect(enderecoDaCliente(pedido.cliente)).toBe("não informado no pedido");
  });
});

describe("descricaoDoItem", () => {
  it("sem extras, só o nome", () => {
    expect(descricaoDoItem({ ...safari, topo: null, base: null, personalizacao: null })).toBe("Safari · 3 andares");
  });
});

describe("textoParaPdf", () => {
  it("troca os símbolos que a fonte do PDF não tem", () => {
    expect(textoParaPdf("R$ 50,00 – “ok” • fim")).toBe('R$ 50,00 - "ok" - fim');
  });
});
