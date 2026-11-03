import { describe, expect, it } from "vitest";
import { enderecoEmTexto, errosDoEndereco, temAlgumCampo } from "@/lib/endereco";

const completo = { cep: "21321000", rua: "Rua B", numero: "5", complemento: "apto 2", bairro: "Centro", cidade: "Rio de Janeiro", uf: "rj" };

describe("errosDoEndereco", () => {
  it("aceita o endereço completo, sem complemento", () => {
    expect(errosDoEndereco({ ...completo, complemento: "" })).toEqual({});
  });
  it("aponta cada campo que falta", () => {
    expect(Object.keys(errosDoEndereco({ cep: "123" }))).toEqual(["cep", "rua", "numero", "bairro", "cidade", "uf"]);
    expect(errosDoEndereco({ ...completo, uf: "Rio" })).toEqual({ uf: "Estado com 2 letras, ex.: RJ." });
  });
});

describe("temAlgumCampo", () => {
  it("sabe se a cliente começou a preencher", () => {
    expect(temAlgumCampo({ cep: "", rua: " " })).toBe(false);
    expect(temAlgumCampo({ numero: "5" })).toBe(true);
  });
});

describe("enderecoEmTexto", () => {
  it("monta o endereço numa linha, com o CEP formatado", () => {
    expect(enderecoEmTexto(completo)).toBe("Rua B, 5, apto 2, Centro, Rio de Janeiro/RJ, CEP 21321-000");
    expect(enderecoEmTexto({ ...completo, numero: "", complemento: "" })).toBe("Rua B, s/n, Centro, Rio de Janeiro/RJ, CEP 21321-000");
    expect(enderecoEmTexto({ cep: "21321000" })).toBeNull();
  });
});
