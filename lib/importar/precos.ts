import { montarVitrine, podeReservar } from "@/lib/catalogo";
import type { Catalogo } from "@/types/catalogo";

// Uma linha da tabela "precos" do Supabase
export type LinhaDePreco = {
  codigo: string;
  tipo: "opcao" | "topo" | "base";
  codigo_bolo: string | null;
  preco_locacao: number;
  preco_venda: number | null;
  ativo: boolean;
};

// Transforma o catálogo (o mesmo que o site usa) nas linhas de preço do banco.
// Só fica "ativo" o que o site deixa reservar ou comprar.
export function linhasDePreco(catalogo: Catalogo): LinhaDePreco[] {
  const bolosNoSite = new Set(montarVitrine(catalogo).map((bolo) => bolo.codigo));

  const opcoes: LinhaDePreco[] = catalogo.opcoes.map((opcao) => ({
    codigo: opcao.codigo,
    tipo: "opcao",
    codigo_bolo: opcao.codigoBolo,
    preco_locacao: opcao.precoLocacao,
    preco_venda: opcao.precoVenda,
    ativo: bolosNoSite.has(opcao.codigoBolo),
  }));

  const acessorios = (tipo: "topo" | "base", lista: Catalogo["topos"]): LinhaDePreco[] =>
    lista.map((peca) => ({
      codigo: peca.codigo,
      tipo,
      codigo_bolo: null,
      preco_locacao: peca.precoLocacao,
      preco_venda: null,
      ativo: podeReservar(peca.status),
    }));

  return [...opcoes, ...acessorios("topo", catalogo.topos), ...acessorios("base", catalogo.bases)];
}
