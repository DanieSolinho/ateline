import dados from "@/data/catalogo.json";
import type { Acessorio, BoloRefazivel, BoloVitrine, Catalogo, Cupom, StatusPeca } from "@/types/catalogo";

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

// Os bolos marcados como destaque na planilha vêm primeiro (até 4). Se forem menos de 4,
// a vitrine completa com os próximos bolos, para a página inicial não ficar com buraco.
export function escolherDestaques(vitrine: BoloVitrine[], maximo = 4): BoloVitrine[] {
  const marcados = vitrine.filter((bolo) => bolo.destaque);
  const outros = vitrine.filter((bolo) => !bolo.destaque);
  return [...marcados, ...outros].slice(0, maximo);
}

export async function getDestaques(): Promise<BoloVitrine[]> {
  return escolherDestaques(await getVitrine());
}

// Quanto custa repor o bolo, se a planilha tiver o valor (vai no contrato)
export function valorDeReposicao(codigo: string, dadosDoCatalogo: Catalogo = catalogo): number | null {
  return dadosDoCatalogo.bolos.find((b) => b.codigo === codigo)?.valorReposicao ?? null;
}

export async function getTopos(codigos: string[]): Promise<Acessorio[]> {
  return catalogo.topos.filter((topo) => codigos.includes(topo.codigo) && podeReservar(topo.status));
}

export async function getBases(): Promise<Acessorio[]> {
  return catalogo.bases.filter((base) => podeReservar(base.status));
}

// Bolos "Inativo" que podem ser refeitos e têm preço de encomenda nova em alguma opção
export function montarRefaziveis(dadosDoCatalogo: Catalogo): BoloRefazivel[] {
  return dadosDoCatalogo.bolos
    .filter((bolo) => bolo.status === "inativo" && bolo.podeSerRefeito)
    .map((bolo) => ({
      ...bolo,
      opcoes: dadosDoCatalogo.opcoes
        .filter((opcao) => opcao.codigoBolo === bolo.codigo)
        .filter((opcao): opcao is BoloRefazivel["opcoes"][number] => opcao.precoEncomendaNova !== null)
        .sort((a, b) => a.andares - b.andares || (a.decoracao ?? "").localeCompare(b.decoracao ?? "")),
    }))
    .filter((bolo) => bolo.opcoes.length > 0);
}

export async function getRefaziveis(): Promise<BoloRefazivel[]> {
  return montarRefaziveis(catalogo);
}

export async function getCupomRefazer(): Promise<Cupom | null> {
  return catalogo.cupomRefazer;
}

// O nome de uma peça pelo código (bolo, topo ou base), para o painel e os relatórios
export function nomeDaPeca(codigo: string, dadosDoCatalogo: Catalogo = catalogo): string {
  const bolo = dadosDoCatalogo.bolos.find((b) => b.codigo === codigo);
  if (bolo) return bolo.nome;
  const acessorio = [...dadosDoCatalogo.topos, ...dadosDoCatalogo.bases].find((a) => a.codigo === codigo);
  return acessorio?.nome ?? codigo;
}

// O código é de um bolo (e não de um topo ou base)?
export function eBolo(codigo: string, dadosDoCatalogo: Catalogo = catalogo): boolean {
  return dadosDoCatalogo.bolos.some((b) => b.codigo === codigo);
}
