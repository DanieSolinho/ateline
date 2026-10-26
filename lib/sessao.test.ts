import { describe, expect, it } from "vitest";
import { enderecoDeVolta, mensagemDeErroDoLogin } from "./sessao";

describe("enderecoDeVolta", () => {
  it("volta para a Minha conta, com o /ateline quando está no GitHub Pages", () => {
    expect(enderecoDeVolta("http://localhost:3000", "")).toBe("http://localhost:3000/conta/");
    expect(enderecoDeVolta("https://daniesolinho.github.io", "/ateline")).toBe(
      "https://daniesolinho.github.io/ateline/conta/",
    );
  });
});

describe("mensagemDeErroDoLogin", () => {
  it("explica o limite de e-mails em português", () => {
    expect(mensagemDeErroDoLogin("email rate limit exceeded")).toContain("Espere alguns minutos");
    expect(mensagemDeErroDoLogin("For security purposes, you can only request this after 45 seconds.")).toContain(
      "Espere",
    );
  });
});
