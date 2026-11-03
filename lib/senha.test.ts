import { describe, expect, it } from "vitest";
import { mensagemDeErroDaSenha, problemaDaSenha } from "@/lib/senha";

describe("problemaDaSenha", () => {
  it("aceita senha com 8 ou mais caracteres, igual nos dois campos", () => {
    expect(problemaDaSenha("bolo2026!", "bolo2026!")).toBeNull();
  });
  it("aponta senha curta, com espaço nas pontas ou diferente na confirmação", () => {
    expect(problemaDaSenha("bolo", "bolo")).toContain("8 caracteres");
    expect(problemaDaSenha(" bolo2026", " bolo2026")).toContain("espaços");
    expect(problemaDaSenha("bolo2026!", "bolo2027!")).toContain("diferentes");
  });
});

describe("mensagemDeErroDaSenha", () => {
  it("traduz as mensagens do Supabase", () => {
    expect(mensagemDeErroDaSenha("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
    expect(mensagemDeErroDaSenha("New password should be different from the old password.")).toContain("senha atual");
    expect(mensagemDeErroDaSenha("Password should be at least 6 characters.")).toContain("Senha fraca");
    expect(mensagemDeErroDaSenha("Request rate limit reached")).toContain("Espere");
    expect(mensagemDeErroDaSenha("Failed to fetch")).toContain("internet");
  });
});
