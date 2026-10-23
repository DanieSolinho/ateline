import { describe, expect, it } from "vitest";
import {
  criarEsquemaEncomenda,
  dataMinimaParaRefazer,
  mensagemDeEncomenda,
  precoComCupom,
  somarDias,
  type BoloParaRefazer,
} from "./encomenda";

const cupom = { codigo: "REFAZ30", desconto: 0.3 };
const jardim: BoloParaRefazer = { codigo: "JARDIM_001", nome: "Jardim", andares: 3, decoracao: "Flores", preco: 400 };

const formulario = {
  finalidade: "alugar",
  festa: "2026-12-12",
  tema: "",
  cores: "rosa e dourado",
  andares: "3",
  observacoes: "",
  nome: "Maria Silva",
  whatsapp: "(21) 98765-4321",
  cupom: "",
};

describe("datas", () => {
  it("soma dias atravessando o mês", () => {
    expect(somarDias("2026-10-23", 10)).toBe("2026-11-02");
  });

  it("refazer pede 20 dias de antecedência", () => {
    expect(dataMinimaParaRefazer("2026-10-23")).toBe("2026-11-12");
  });
});

describe("precoComCupom", () => {
  it("dá 30% com o código certo, mesmo em minúsculas", () => {
    expect(precoComCupom(400, " refaz30 ", cupom)).toEqual({ preco: 280, desconto: 120 });
  });

  it("não dá desconto com código errado ou sem cupom cadastrado", () => {
    expect(precoComCupom(400, "OUTRO", cupom).desconto).toBe(0);
    expect(precoComCupom(400, "REFAZ30", null).desconto).toBe(0);
  });
});

describe("criarEsquemaEncomenda", () => {
  it("no refazer, recusa festa com menos de 20 dias", () => {
    const esquema = criarEsquemaEncomenda("2026-10-23", jardim);
    expect(esquema.safeParse({ ...formulario, festa: "2026-11-11" }).success).toBe(false);
    expect(esquema.safeParse({ ...formulario, festa: "2026-11-12" }).success).toBe(true);
  });

  it("no bolo novo, o tema é obrigatório", () => {
    const esquema = criarEsquemaEncomenda("2026-10-23", null);
    const resultado = esquema.safeParse(formulario);
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["tema"]);
  });
});

describe("mensagemDeEncomenda", () => {
  it("monta o texto do refazer com o cupom aplicado", () => {
    const dados = criarEsquemaEncomenda("2026-10-23", jardim).parse({ ...formulario, cupom: "refaz30" });
    const mensagem = mensagemDeEncomenda(dados, jardim, cupom);
    expect(mensagem).toContain("igual ao Jardim (JARDIM_001)");
    expect(mensagem).toContain("Tamanho: 3 andares · Flores");
    expect(mensagem).toContain("Cupom REFAZ30");
    expect(mensagem.replace(/\s/g, " ")).toContain("R$ 280,00");
    expect(mensagem).toContain("Data da festa: 12/12/2026");
    expect(mensagem).toContain("WhatsApp: 21987654321");
  });
});
