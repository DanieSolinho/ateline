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
    const safari = linhas.find((linha) => linha.codigo_bolo === "SAFARI_001");
    const jardim = linhas.find((linha) => linha.codigo_bolo === "JARDIM_001"); // em manutenção na planilha
    expect(safari).toMatchObject({ tipo: "opcao", ativo: true });
    expect(jardim).toMatchObject({ tipo: "opcao", ativo: false });
  });

  it("topos e bases levam o preço de locação", () => {
    const topo = linhas.find((linha) => linha.codigo === "TOPO_001");
    const topoNaPlanilha = catalogo.topos.find((peca) => peca.codigo === "TOPO_001");
    expect(topo).toMatchObject({ tipo: "topo", preco_locacao: topoNaPlanilha?.precoLocacao, codigo_bolo: null });
  });
});
