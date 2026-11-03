import { describe, expect, it } from "vitest";
import { nomeDaFoto, pastaDoGrupo, quandoFoiTirada, tamanhoReduzido } from "@/lib/fotos";

describe("fotos das peças", () => {
  it("a pasta é a da primeira reserva do aluguel", () => {
    expect(pastaDoGrupo({ ids: [42, 17, 30] })).toBe("reserva-17");
  });

  it("o nome do arquivo guarda a data e a hora, e dá para ler de volta", () => {
    const quando = new Date("2026-11-03T19:25:07.123Z");
    expect(nomeDaFoto(quando)).toBe("2026-11-03T19-25-07-123Z.jpg");
    expect(nomeDaFoto(quando, "-2")).toBe("2026-11-03T19-25-07-123Z-2.jpg");
    expect(quandoFoiTirada("2026-11-03T19-25-07-123Z-2.jpg")).toBe("2026-11-03T19:25:07.123Z");
    expect(quandoFoiTirada("foto.jpg")).toBeNull();
  });

  it("reduz a foto mantendo a proporção, sem aumentar foto pequena", () => {
    expect(tamanhoReduzido(4032, 3024)).toEqual({ largura: 1600, altura: 1200 });
    expect(tamanhoReduzido(3024, 4032)).toEqual({ largura: 1200, altura: 1600 });
    expect(tamanhoReduzido(800, 600)).toEqual({ largura: 800, altura: 600 });
  });
});
