import { describe, expect, it } from "vitest";
import { esquemaPerfil, linhaDoPerfil, perfilDaLinha } from "./perfil";

const semEndereco = { cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };
const enderecoNoBanco = { cep: "21321000", rua: "Rua B", numero: "5", complemento: null, bairro: "Centro", cidade: "Rio de Janeiro", uf: "RJ" };

describe("perfil", () => {
  it("converte entre o formato do banco e o do site", () => {
    const linha = { nome: "Maria", cpf: "52998224725", whatsapp: "21987654321", chave_pix: null, ...enderecoNoBanco };
    const perfil = perfilDaLinha(linha);
    expect(perfil).toEqual({
      nome: "Maria",
      cpf: "52998224725",
      whatsapp: "21987654321",
      chavePix: "",
      ...enderecoNoBanco,
      complemento: "",
    });
    expect(linhaDoPerfil("id-1", perfil)).toEqual({ id: "id-1", ...linha });
  });

  it("perfil antigo, sem as colunas de endereço, continua funcionando", () => {
    expect(perfilDaLinha({ nome: "Maria", cpf: null, whatsapp: null, chave_pix: null }).rua).toBe("");
  });

  it("valida e limpa a pontuação antes de salvar", () => {
    const resultado = esquemaPerfil.safeParse({
      nome: " Maria Silva ",
      cpf: "529.982.247-25",
      whatsapp: "(21) 98765-4321",
      chavePix: "",
    });
    expect(resultado.data).toEqual({ nome: "Maria Silva", cpf: "52998224725", whatsapp: "21987654321", chavePix: "", ...semEndereco });
    expect(esquemaPerfil.safeParse({ nome: "Maria", cpf: "111", whatsapp: "21", chavePix: "" }).success).toBe(false);
  });

  it("endereço é opcional, mas se começar tem que completar", () => {
    const base = { nome: "Maria Silva", cpf: "52998224725", whatsapp: "21987654321", chavePix: "" };
    const pela_metade = esquemaPerfil.safeParse({ ...base, cep: "21321-000" });
    expect(pela_metade.error?.issues.map((problema) => problema.path[0])).toEqual(["rua", "numero", "bairro", "cidade", "uf"]);
    const completo = esquemaPerfil.safeParse({ ...base, cep: "21321-000", rua: "Rua B", numero: "5", bairro: "Centro", cidade: "Rio", uf: "rj" });
    expect(completo.data?.cep).toBe("21321000");
    expect(completo.data?.uf).toBe("RJ");
  });
});
