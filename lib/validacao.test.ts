import { describe, expect, it } from "vitest";
import { cpfValido, somenteDigitos, telefoneValido } from "./validacao";

describe("somenteDigitos", () => {
  it("tira pontos, traços e espaços", () => {
    expect(somenteDigitos("(21) 98765-4321")).toBe("21987654321");
  });
});

describe("cpfValido", () => {
  it("aceita um CPF válido, com ou sem pontuação", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(cpfValido("529.982.247-26")).toBe(false);
  });

  it("recusa números repetidos e tamanho errado", () => {
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("1234")).toBe(false);
  });
});

describe("telefoneValido", () => {
  it("aceita celular e fixo com DDD", () => {
    expect(telefoneValido("(21) 98765-4321")).toBe(true);
    expect(telefoneValido("(21) 3456-7890")).toBe(true);
  });

  it("recusa sem DDD", () => {
    expect(telefoneValido("98765-4321")).toBe(false);
  });
});