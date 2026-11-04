import { formatarPreco } from "@/lib/formatar";
import { calcularPeriodo, estaDisponivel } from "@/lib/periodo";
import { supabase } from "@/lib/supabase";
import type { BoloVitrine } from "@/types/catalogo";
import type { Reserva } from "@/types/reserva";

// Posts do Instagram: o painel cria o rascunho, a dona aprova e agenda,
// e na hora marcada o painel entrega a legenda e a imagem prontas para postar.
export type TipoDePost = "livres" | "destaque" | "como-funciona" | "livre";
export type StatusDoPost = "rascunho" | "agendado" | "publicado" | "descartado";

// O que a imagem mostra
export type DadosDoPost = {
  data?: string; // "2026-11-14" (posts de bolos livres)
  bolos?: { codigo: string; nome: string; tema: string }[];
  preco?: number; // aluguel a partir de (destaque)
  texto?: string; // frase do post em branco
};

export type Post = {
  id: number;
  tipo: TipoDePost;
  titulo: string;
  legenda: string;
  dados: DadosDoPost;
  status: StatusDoPost;
  agendadoPara: string | null;
  criadoPor: string | null;
  aprovadoPor: string | null;
  criadoEm: string;
  publicadoEm: string | null;
};

export type Rascunho = Pick<Post, "tipo" | "titulo" | "legenda" | "dados">;

export const LIMITE_DA_LEGENDA = 2200;
const HASHTAGS = "#bolocenografico #bolofake #festainfantil #decoracaodefesta #pracaseca #riodejaneiro";
const CHAMADA = "📲 Veja as datas livres e reserve pelo site (link na bio) ou chame no WhatsApp.";

// "2026-11-14" → "14/11"
function diaMes(iso: string): string {
  return iso.slice(8, 10) + "/" + iso.slice(5, 7);
}

// O próximo sábado cuja retirada (sexta) ainda não passou
export function proximoSabado(hoje: string): string {
  const data = new Date(`${hoje}T00:00:00Z`);
  do {
    data.setUTCDate(data.getUTCDate() + 1);
  } while (data.getUTCDay() !== 6 || calcularPeriodo(data.toISOString().slice(0, 10)).retirada <= hoje);
  return data.toISOString().slice(0, 10);
}

const resumoDoBolo = (bolo: BoloVitrine) => ({ codigo: bolo.codigo, nome: bolo.nome, tema: bolo.tema });

// "Livres para sábado": os bolos que ainda dá para alugar na data
export function rascunhoLivres(bolos: BoloVitrine[], reservas: Reserva[], hoje: string, maximo = 6): Rascunho | null {
  const sabado = proximoSabado(hoje);
  const livres = bolos.filter((bolo) => estaDisponivel(bolo.codigo, sabado, reservas)).slice(0, maximo);
  if (livres.length === 0) return null;
  const lista = livres.map((bolo) => `🎂 ${bolo.nome}`).join("\n");
  return {
    tipo: "livres",
    titulo: `Livres para sábado, ${diaMes(sabado)}`,
    dados: { data: sabado, bolos: livres.map(resumoDoBolo) },
    legenda:
      `Festa no sábado, ${diaMes(sabado)}? Estes bolos ainda estão livres:\n\n${lista}\n\n` +
      `A retirada é na sexta, aqui na Praça Seca, e a devolução na terça.\n${CHAMADA}\n\n${HASHTAGS}`,
  };
}

// Destaque de um bolo do acervo
export function rascunhoDestaque(bolo: BoloVitrine): Rascunho {
  return {
    tipo: "destaque",
    titulo: bolo.nome,
    dados: { bolos: [resumoDoBolo(bolo)], preco: bolo.menorPrecoLocacao },
    legenda:
      `✨ ${bolo.nome}\n\nTema ${bolo.tema}, de ${bolo.andaresMin} a ${bolo.andaresMax} andares, ` +
      `com personalização de nome e idade. Aluguel a partir de ${formatarPreco(bolo.menorPrecoLocacao)}.\n\n` +
      `${CHAMADA}\n\n${HASHTAGS}`,
  };
}

// Post explicando como o aluguel funciona (bom para fixar no perfil)
export function rascunhoComoFunciona(): Rascunho {
  return {
    tipo: "como-funciona",
    titulo: "Como alugar seu bolo",
    dados: {},
    legenda:
      "Alugar um bolo cenográfico na Ateline é simples:\n\n" +
      "1️⃣ Escolha o bolo e a data da festa no site: ele mostra na hora o que está livre.\n" +
      "2️⃣ Garanta a reserva com o sinal de 50%.\n" +
      "3️⃣ Retire na véspera aqui na Praça Seca e devolva depois da festa.\n\n" +
      `Sem cola, sem bagunça e com aquela foto linda na mesa do bolo. 💕\n${CHAMADA}\n\n${HASHTAGS}`,
  };
}

// Post em branco, para a dona escrever do jeito dela
export function rascunhoLivre(): Rascunho {
  return { tipo: "livre", titulo: "Novidade na Ateline", dados: { texto: "Escreva aqui a frase do post" }, legenda: `\n\n${HASHTAGS}` };
}

// Agendado: já passou da hora ("postar"), é hoje mais tarde ("hoje") ou outro dia ("depois")
export function momentoDoAgendado(agendadoPara: string, agora: Date): "postar" | "hoje" | "depois" {
  const quando = new Date(agendadoPara);
  if (quando <= agora) return "postar";
  return quando.toDateString() === agora.toDateString() ? "hoje" : "depois";
}

// Campo "datetime-local" (horário de quem está usando) ⇄ data ISO
export function paraCampoDeData(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
export function doCampoDeData(valor: string): string | null {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

// ---------------------------------------------------------------------
// Banco (tabela posts_instagram, só a equipe)
// ---------------------------------------------------------------------
type LinhaDePost = {
  id: number;
  tipo: TipoDePost;
  titulo: string;
  legenda: string;
  dados: DadosDoPost;
  status: StatusDoPost;
  agendado_para: string | null;
  criado_por: string | null;
  aprovado_por: string | null;
  criado_em: string;
  publicado_em: string | null;
};

export function postDaLinha(linha: LinhaDePost): Post {
  return {
    id: linha.id,
    tipo: linha.tipo,
    titulo: linha.titulo,
    legenda: linha.legenda,
    dados: linha.dados ?? {},
    status: linha.status,
    agendadoPara: linha.agendado_para,
    criadoPor: linha.criado_por,
    aprovadoPor: linha.aprovado_por,
    criadoEm: linha.criado_em,
    publicadoEm: linha.publicado_em,
  };
}

const ERRO_GENERICO = "Não deu certo agora. Confira a internet e tente de novo.";

export async function buscarPosts(): Promise<Post[] | null> {
  const { data, error } = await supabase
    .from("posts_instagram")
    .select("*")
    .neq("status", "descartado")
    .order("criado_em", { ascending: false })
    .limit(60);
  if (error) {
    console.warn("Não deu para buscar os posts:", error.message);
    return null;
  }
  return (data as LinhaDePost[]).map(postDaLinha);
}

export async function criarPost(rascunho: Rascunho): Promise<string | null> {
  const { error } = await supabase.from("posts_instagram").insert(rascunho);
  return error ? ERRO_GENERICO : null;
}

export type MudancaDoPost = Partial<{
  titulo: string;
  legenda: string;
  dados: DadosDoPost;
  status: StatusDoPost;
  agendado_para: string | null;
}>;

export async function salvarPost(id: number, mudanca: MudancaDoPost): Promise<string | null> {
  const { error } = await supabase.from("posts_instagram").update(mudanca).eq("id", id);
  return error ? ERRO_GENERICO : null;
}
