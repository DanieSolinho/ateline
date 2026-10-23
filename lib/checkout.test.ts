import { describe, expect, it } from "vitest";
import { esquemaCheckout } from "./checkout";

const valido = {
  nome: "Maria Silva",
  cpf: "529.982.247-25",
  whatsapp: "(21) 98765-4321",
  email: "maria@exemplo.com",
  entrega: "retirada",
  pagamento: "pix",
  aceite: "sim",
};

describe("esquemaCheckout", () => {
  it("aceita um pedido completo e limpa a pontuação", () => {
    const resultado = esquemaCheckout.safeParse(valido);
    expect(resultado.success).toBe(true);
    expect(resultado.data?.cpf).toBe("52998224725");
  });

  it("não deixa reservar sem aceitar o contrato", () => {
    const resultado = esquemaCheckout.safeParse({ ...valido, aceite: undefined });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["aceite"]);
  });

  it("exige endereço só quando é entrega", () => {
    expect(esquemaCheckout.safeParse({ ...valido, entrega: "entrega" }).success).toBe(false);
    expect(
      esquemaCheckout.safeParse({ ...valido, entrega: "entrega", endereco: "Rua X, 10, Benfica, 20911-000" }).success,
    ).toBe(true);
  });
});