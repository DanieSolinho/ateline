import { describe, expect, it } from "vitest";
import { abertoComoApp, eIosOuIpad } from "@/lib/instalar";

const janela = (standalone: boolean, media: boolean) => ({
  navigator: { standalone } as unknown as Navigator,
  matchMedia: () => ({ matches: media }) as MediaQueryList,
});

describe("instalar o painel", () => {
  it("sabe quando já está aberto como app", () => {
    expect(abertoComoApp(janela(false, true))).toBe(true); // Android
    expect(abertoComoApp(janela(true, false))).toBe(true); // iPhone
    expect(abertoComoApp(janela(false, false))).toBe(false);
  });

  it("reconhece iPhone e iPad (inclusive o iPad que se diz Mac)", () => {
    expect(eIosOuIpad("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(true);
    expect(eIosOuIpad("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(eIosOuIpad("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(eIosOuIpad("Mozilla/5.0 (Linux; Android 14; Pixel 7)", 5)).toBe(false);
  });
});
