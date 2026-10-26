import { describe, expect, it } from "vitest";
import { esquemaPerfil, linhaDoPerfil, perfilDaLinha } from "./perfil";

describe("perfil", () => {
  it("converte entre o formato do banco e o do site", () => {
    const linha = { nome: "Maria", cpf: "52998224725", whatsapp: "21987654321", chave_pix: null };
    const perfil = perfilDaLinha(linha);
    expect(perfil).toEqual({ nome: "Maria", cpf: "52998224725", whatsapp: "21987654321", chavePix: "" });
    expect(linhaDoPerfil("id-1", perfil)).toEqual({ id: "id-1", ...linha });
  });

  it("valida e limpa a pontuação antes de salvar", () => {
    const resultado = esquemaPerfil.safeParse({
      nome: " Maria Silva ",
      cpf: "529.982.247-25",
      whatsapp: "(21) 98765-4321",
      chavePix: "",
    });
    expect(resultado.data).toEqual({ nome: "Maria Silva", cpf: "52998224725", whatsapp: "21987654321", chavePix: "" });
    expect(esquemaPerfil.safeParse({ nome: "Maria", cpf: "111", whatsapp: "21", chavePix: "" }).success).toBe(false);
  });
});
