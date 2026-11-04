import { describe, expect, it } from "vitest";
import {
  doCampoDeData,
  momentoDoAgendado,
  paraCampoDeData,
  proximoSabado,
  rascunhoComoFunciona,
  rascunhoDestaque,
  rascunhoLivres,
  LIMITE_DA_LEGENDA,
} from "@/lib/instagram";
import type { BoloVitrine } from "@/types/catalogo";

const bolo = (codigo: string, nome: string): BoloVitrine =>
  ({ codigo, nome, tema: "Safari", andaresMin: 3, andaresMax: 5, menorPrecoLocacao: 150, menorPrecoVenda: null, decoracoes: [], opcoes: [] }) as unknown as BoloVitrine;

describe("posts do Instagram", () => {
  it("acha o próximo sábado em que ainda dá para retirar na sexta", () => {
    expect(proximoSabado("2026-11-04")).toBe("2026-11-07"); // quarta → sábado 07 (retirada sexta 06)
    expect(proximoSabado("2026-11-06")).toBe("2026-11-14"); // sexta: a retirada de amanhã é hoje → próximo
    expect(proximoSabado("2026-11-07")).toBe("2026-11-14");
  });

  it("lista só os bolos livres no sábado, no máximo 6", () => {
    const bolos = ["A", "B", "C", "D", "E", "F", "G"].map((letra) => bolo(`${letra}_001`, `Bolo ${letra}`));
    const rascunho = rascunhoLivres(bolos, [{ codigo: "A_001", festa: "2026-11-07" }], "2026-11-04")!;
    expect(rascunho.titulo).toBe("Livres para sábado, 07/11");
    expect(rascunho.dados.bolos?.map((b) => b.codigo)).toEqual(["B_001", "C_001", "D_001", "E_001", "F_001", "G_001"]);
    expect(rascunho.legenda).toContain("🎂 Bolo B");
    expect(rascunho.legenda).not.toContain("Bolo A");
    expect(rascunhoLivres([bolos[0]], [{ codigo: "A_001", festa: "2026-11-07" }], "2026-11-04")).toBeNull();
  });

  it("monta destaque e como funciona dentro do limite do Instagram", () => {
    const destaque = rascunhoDestaque(bolo("SAFARI_001", "Safari"));
    expect(destaque.legenda).toContain("Aluguel a partir de R$");
    expect(destaque.dados.preco).toBe(150);
    expect(rascunhoComoFunciona().legenda.length).toBeLessThan(LIMITE_DA_LEGENDA);
  });

  it("sabe se o post agendado já está na hora", () => {
    const agora = new Date("2026-11-14T13:00:00Z");
    expect(momentoDoAgendado("2026-11-14T12:00:00Z", agora)).toBe("postar");
    expect(momentoDoAgendado("2026-11-14T15:00:00Z", agora)).toBe("hoje");
    expect(momentoDoAgendado("2026-11-20T15:00:00Z", agora)).toBe("depois");
  });

  it("converte a data do campo e de volta", () => {
    const iso = doCampoDeData("2026-11-14T10:30")!;
    expect(paraCampoDeData(iso)).toBe("2026-11-14T10:30");
    expect(doCampoDeData("")).toBeNull();
    expect(paraCampoDeData(null)).toBe("");
  });
});

describe("nome da imagem", () => {
  it("fica sem acentos nem espaços", async () => {
    const { nomeDaImagem } = await import("@/lib/imagemDoPost");
    expect(nomeDaImagem({ id: 7, titulo: "Livres para sábado, 14/11" })).toBe("ateline-post-7-livres-para-sabado-14-11.png");
  });
});
