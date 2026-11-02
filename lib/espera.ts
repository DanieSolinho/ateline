import { supabase } from "@/lib/supabase";
import { somenteDigitos, telefoneValido } from "@/lib/validacao";

export type EntradaDeEspera = {
  id: number;
  codigo: string;
  festa: string;
  nome: string;
  whatsapp: string;
  criadoEm: string;
  liberou: boolean; // a data ficou livre de novo
};

// "Me avise se liberar". Devolve null se deu certo, ou a mensagem de erro.
export async function entrarNaListaDeEspera(
  codigo: string,
  festa: string,
  nome: string,
  whatsapp: string,
): Promise<string | null> {
  if (nome.trim().length < 2) return "Escreva seu nome.";
  if (!telefoneValido(whatsapp)) return "Coloque o WhatsApp com DDD.";

  const { error } = await supabase.rpc("entrar_na_lista_espera", {
    codigo_do_bolo: codigo,
    data_da_festa: festa,
    nome_da_cliente: nome.trim(),
    whatsapp_da_cliente: somenteDigitos(whatsapp),
  });
  if (!error) return null;
  if (error.message.includes("LIMITE_ESPERA")) return "Você já está esperando por muitas datas. Fale com a gente no WhatsApp.";
  if (error.message.includes("DATA_INVALIDA")) return "Essa data já passou.";
  return "Não conseguimos registrar agora. Tente de novo em instantes.";
}

export async function buscarListaDeEspera(): Promise<EntradaDeEspera[] | null> {
  const { data, error } = await supabase.rpc("lista_de_espera");
  if (error) {
    console.warn("Não deu para buscar a lista de espera:", error.message);
    return null;
  }
  return data as EntradaDeEspera[];
}

export async function marcarEspera(id: number, acao: "avisado" | "remover"): Promise<string | null> {
  const { error } = await supabase.rpc("marcar_espera", { id_da_espera: id, acao });
  return error ? "Não deu certo agora. Tente de novo." : null;
}

// A mensagem que a dona manda quando a data libera
export function mensagemDeAvisoDeEspera(nome: string, nomeDoBolo: string, dia: string, link: string): string {
  const primeiroNome = nome.trim().split(" ")[0];
  return `Olá, ${primeiroNome}! Aqui é da Ateline. O bolo ${nomeDoBolo} ficou livre para ${dia}. Se ainda quiser, é só reservar pelo site: ${link}`;
}
