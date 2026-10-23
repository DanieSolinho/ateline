import { describe, expect, it } from "vitest";
import { buscarCep, cepValido, formatarCep } from "./cep";

// Um "fetch" de mentira, para o teste não depender da internet
function respostaFalsa(corpo: unknown, ok = true) {
  return (async () => ({ ok, json: async () => corpo })) as unknown as typeof fetch;
}

describe("cep", () => {
  it("valida e formata", () => {
    expect(cepValido("20911-000")).toBe(true);
    expect(cepValido("2091")).toBe(false);
    expect(formatarCep("20911000")).toBe("20911-000");
  });

  it("traduz a resposta do ViaCEP", async () => {
    const buscar = respostaFalsa({ logradouro: "Rua Cândido Benício", bairro: "Praça Seca", localidade: "Rio de Janeiro", uf: "RJ" });
    expect(await buscarCep("21321-000", buscar)).toEqual({
      rua: "Rua Cândido Benício",
      bairro: "Praça Seca",
      cidade: "Rio de Janeiro",
      uf: "RJ",
    });
  });

  it("CEP inexistente ou falha de rede devolvem null", async () => {
    expect(await buscarCep("00000-000", respostaFalsa({ erro: true }))).toBeNull();
    const semInternet = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await buscarCep("21321-000", semInternet)).toBeNull();
  });
});
