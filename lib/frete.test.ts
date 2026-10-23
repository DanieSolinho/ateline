import { describe, expect, it } from "vitest";
import { mensagemOrcamentoFrete } from "./frete";
import type { Pedido } from "@/types/pedido";

const pedido = {
  numero: "ATL-123456",
  criadoEm: "2026-10-23T18:00:00.000Z",
  cliente: {
    nome: "Maria Silva",
    cpf: "52998224725",
    whatsapp: "21987654321",
    email: "maria@exemplo.com",
    pagamento: "pix",
    recebimento: "envio",
    cep: "01310100",
    rua: "Avenida Paulista",
    numero: "1000",
    complemento: "apto 12",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
  },
  itens: [
    { tipo: "compra", codigoBolo: "JARDIM_001", codigoOpcao: "X", nome: "Jardim · 3 andares", preco: 420, personalizacao: null },
  ],
  pagoAgora: 210,
  naRetirada: 0,
  restanteCompra: 210,
} as Pedido;

describe("mensagemOrcamentoFrete", () => {
  it("leva o número do pedido, o bolo e o endereço completo", () => {
    const mensagem = mensagemOrcamentoFrete(pedido);
    expect(mensagem).toContain("pedido ATL-123456");
    expect(mensagem).toContain("Jardim · 3 andares (JARDIM_001)");
    expect(mensagem).toContain("Avenida Paulista, 1000 (apto 12)");
    expect(mensagem).toContain("São Paulo/SP");
    expect(mensagem).toContain("CEP 01310-100");
  });
});
