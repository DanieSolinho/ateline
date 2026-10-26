import { describe, expect, it } from "vitest";
import { converterReservas } from "./reservas";

describe("converterReservas", () => {
  it("transforma as linhas do banco no formato que o site usa", () => {
    expect(converterReservas([{ codigo: "SAFARI_001", festa: "2026-10-31" }])).toEqual([
      { codigo: "SAFARI_001", festa: "2026-10-31" },
    ]);
  });
});
