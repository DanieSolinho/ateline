import { describe, expect, it } from "vitest";
import dados from "@/data/catalogo.json";
import { linhasDePreco } from "./precos";
import type { Catalogo } from "@/types/catalogo";

const catalogo = dados as Catalogo;

describe("linhasDePreco", () => {
  const linhas = linhasDePreco(catalogo);

  it("tem uma linha por opção, topo e base da planilha", () => {
    expect(linhas).toHaveLength(catalogo.opcoes.length + catalogo.topos.length + catalogo.bases.length);
  });

  it("opções de bolo fora do site (manutenção, inativo) ficam inativas", () => {
    // Não depende de quais bolos estão na planilha: marca o primeiro bolo como em manutenção.
    const [primeiro, ...resto] = catalogo.bolos;
    const comManutencao: Catalogo = {
      ...catalogo,
      bolos: [{ ...primeiro, status: "manutencao" }, ...resto],
    };
    const outras = linhasDePreco(comManutencao);
    const doPrimeiro = outras.filter((linha) => linha.codigo_bolo === primeiro.codigo);
    const dosOutros = outras.filter((linha) => linha.tipo === "opcao" && linha.codigo_bolo !== primeiro.codigo);
    expect(doPrimeiro.length).toBeGreaterThan(0);
    expect(doPrimeiro.every((linha) => linha.ativo === false)).toBe(true);
    expect(dosOutros.some((linha) => linha.ativo)).toBe(true);
  });

  it("topos e bases levam o preço de locação", () => {
    const topo = linhas.find((linha) => linha.codigo === "TOPO_001");
    const topoNaPlanilha = catalogo.topos.find((peca) => peca.codigo === "TOPO_001");
    expect(topo).toMatchObject({ tipo: "topo", preco_locacao: topoNaPlanilha?.precoLocacao, codigo_bolo: null });
  });
});
