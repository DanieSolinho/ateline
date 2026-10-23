import { describe, expect, it } from "vitest";
import { linkWhatsApp, mensagemDaPagina } from "./contato";

describe("linkWhatsApp", () => {
  it("monta o link com a mensagem codificada", () => {
    expect(linkWhatsApp("Olá! Tudo bem?", "+55 (21) 99999-8888")).toBe(
      "https://wa.me/5521999998888?text=Ol%C3%A1!%20Tudo%20bem%3F",
    );
  });

  it("sem número, devolve null (e o botão não aparece)", () => {
    expect(linkWhatsApp("Olá", "")).toBeNull();
  });
});

describe("mensagemDaPagina", () => {
  it("na página de um bolo, cita o código do bolo", () => {
    expect(mensagemDaPagina("/bolo/SAFARI_001/")).toContain("SAFARI_001");
  });

  it("no carrinho e no checkout, fala da reserva", () => {
    expect(mensagemDaPagina("/checkout")).toContain("finalizando uma reserva");
  });

  it("nas outras páginas, uma mensagem geral", () => {
    expect(mensagemDaPagina("/")).toBe("Olá! Vim pelo site da Ateline e tenho uma dúvida.");
  });
});
