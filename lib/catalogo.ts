import dados from "@/data/catalogo.json";
import type { Acessorio, BoloVitrine, Catalogo, StatusPeca } from "@/types/catalogo";

// Os dados vêm de data/catalogo.json, gerado por "npm run importar".
// Quando o Supabase entrar, só este arquivo muda.
const catalogo = dados as Catalogo;

// "Disponível" e "Alugado" podem ser reservados (as datas ocupadas vêm das reservas).
// "Em manutenção" e "Inativo" ficam fora do site.
export function podeReservar(status: StatusPeca): boolean {
  return status === "disponivel" || status === "alugado";
}

export function montarVitrine(dadosDoCatalogo: Catalogo): BoloVitrine[] {
  return dadosDoCatalogo.bolos
    .filter((bolo) => podeReservar(bolo.status))
    .map((bolo) => {
      const opcoes = dadosDoCatalogo.opcoes
        .filter((opcao) => opcao.codigoBolo === bolo.codigo)
        .sort((a, b) => a.andares - b.andares || a.precoLocacao - b.precoLocacao);
      const precosVenda = opcoes
        .map((opcao) => opcao.precoVenda)
        .filter((preco): preco is number => preco !== null);

      return {
        ...bolo,
        opcoes,
        menorPrecoLocacao: Math.min(...opcoes.map((opcao) => opcao.precoLocacao)),
        menorPrecoVenda: precosVenda.length > 0 ? Math.min(...precosVenda) : null,
        decoracoes: [
          ...new Set(opcoes.map((opcao) => opcao.decoracao).filter((d): d is string => d !== null)),
        ],
      };
    })
    .filter((bolo) => bolo.opcoes.length > 0); // bolo sem opção não tem como ser alugado
}

export async function getVitrine(): Promise<BoloVitrine[]> {
  return montarVitrine(catalogo);
}

export async function getBoloDaVitrine(codigo: string): Promise<BoloVitrine | undefined> {
  return (await getVitrine()).find((bolo) => bolo.codigo === codigo);
}

// A planilha ainda não tem coluna de destaque: por enquanto, os 4 primeiros
export async function getDestaques(): Promise<BoloVitrine[]> {
  return (await getVitrine()).slice(0, 4);
}

export async function getTopos(codigos: string[]): Promise<Acessorio[]> {
  return catalogo.topos.filter((topo) => codigos.includes(topo.codigo) && podeReservar(topo.status));
}

export async function getBases(): Promise<Acessorio[]> {
  return catalogo.bases.filter((base) => podeReservar(base.status));
}
