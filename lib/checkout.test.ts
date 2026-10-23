import { describe, expect, it } from "vitest";
import { criarEsquemaCheckout } from "./checkout";

const aluguel = criarEsquemaCheckout({ temAluguel: true, temCompra: false });
const compra = criarEsquemaCheckout({ temAluguel: false, temCompra: true });

const dadosPessoais = {
  nome: "Maria Silva",
  cpf: "529.982.247-25",
  whatsapp: "(21) 98765-4321",
  email: "maria@exemplo.com",
  pagamento: "pix",
};

const valido = { ...dadosPessoais, chavePix: "maria@exemplo.com", entrega: "retirada", aceite: "sim" };

const endereco = {
  cep: "21321-000",
  rua: "Rua Cândido Benício",
  numero: "2967",
  bairro: "Praça Seca",
  cidade: "Rio de Janeiro",
  uf: "rj",
};

// Os campos com erro, na ordem
function camposComErro(resultado: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return resultado.error?.issues.map((problema) => problema.path[0]) ?? [];
}

describe("checkout de aluguel", () => {
  it("aceita um pedido completo e limpa a pontuação", () => {
    const resultado = aluguel.safeParse(valido);
    expect(resultado.success).toBe(true);
    expect(resultado.data?.cpf).toBe("52998224725");
  });

  it("não deixa reservar sem aceitar o contrato", () => {
    expect(camposComErro(aluguel.safeParse({ ...valido, aceite: undefined }))).toEqual(["aceite"]);
  });

  it("exige a chave Pix para devolver a taxa de segurança", () => {
    expect(camposComErro(aluguel.safeParse({ ...valido, chavePix: "" }))).toEqual(["chavePix"]);
  });

  it("exige endereço só quando é entrega", () => {
    expect(aluguel.safeParse({ ...valido, entrega: "entrega" }).success).toBe(false);
    expect(aluguel.safeParse({ ...valido, entrega: "entrega", endereco: "Rua X, 10, Benfica, 20911-000" }).success).toBe(true);
  });
});

describe("checkout de compra", () => {
  it("não pede contrato nem chave Pix", () => {
    expect(compra.safeParse({ ...dadosPessoais, recebimento: "retirada" }).success).toBe(true);
  });

  it("no envio, exige o endereço completo", () => {
    expect(camposComErro(compra.safeParse({ ...dadosPessoais, recebimento: "envio", cep: "123" }))).toEqual([
      "cep",
      "rua",
      "numero",
      "bairro",
      "cidade",
      "uf",
    ]);
    const resultado = compra.safeParse({ ...dadosPessoais, recebimento: "envio", ...endereco });
    expect(resultado.data?.cep).toBe("21321000");
    expect(resultado.data?.uf).toBe("RJ");
  });

  it("pedido com aluguel e compra cobra as regras dos dois", () => {
    const misto = criarEsquemaCheckout({ temAluguel: true, temCompra: true });
    expect(camposComErro(misto.safeParse(valido))).toEqual(["recebimento"]);
    expect(misto.safeParse({ ...valido, recebimento: "retirada" }).success).toBe(true);
  });
});
