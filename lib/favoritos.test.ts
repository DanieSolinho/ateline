import { describe, expect, it } from "vitest";
import {
  alternarFavorito,
  favoritosDoLink,
  limparFavoritos,
  linkDosFavoritos,
  mensagemDosFavoritos,
} from "@/lib/favoritos";

describe("favoritos", () => {
  it("marca e desmarca, com no máximo 3", () => {
    expect(alternarFavorito([], "A_001")).toEqual({ lista: ["A_001"], cheio: false });
    expect(alternarFavorito(["A_001", "B_001"], "A_001")).toEqual({ lista: ["B_001"], cheio: false });
    expect(alternarFavorito(["A_001", "B_001", "C_001"], "D_001")).toEqual({ lista: ["A_001", "B_001", "C_001"], cheio: true });
  });

  it("limpa a lista guardada ou do link", () => {
    expect(limparFavoritos(["A_001", "A_001", "x<script>", 5, "B_001", "C_001", "D_001"])).toEqual(["A_001", "B_001", "C_001"]);
    expect(limparFavoritos(["A_001", "SUMIU_001"], ["A_001"])).toEqual(["A_001"]);
    expect(limparFavoritos("A_001")).toEqual([]);
  });

  it("lê os bolos do link compartilhado", () => {
    expect(favoritosDoLink("?bolos=SAFARI_001,CIRCO_001,NAO_EXISTE", ["SAFARI_001", "CIRCO_001"])).toEqual(["SAFARI_001", "CIRCO_001"]);
    expect(favoritosDoLink("", ["SAFARI_001"])).toEqual([]);
  });

  it("monta o link e a mensagem para a família", () => {
    const link = linkDosFavoritos(["SAFARI_001", "CIRCO_001"]);
    expect(link).toBe("https://daniesolinho.github.io/ateline/favoritos/?bolos=SAFARI_001,CIRCO_001");
    const mensagem = mensagemDosFavoritos(["Safari", "Circo"], link);
    expect(mensagem).toContain("estes 2");
    expect(mensagem).toContain("1. Safari\n2. Circo");
    expect(mensagem).toContain(link);
  });
});
