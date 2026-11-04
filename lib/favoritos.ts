import { urlCompleta } from "@/lib/site";

// Favoritos: a cliente separa até 3 bolos para mostrar à família e decidir junto
export const MAXIMO_DE_FAVORITOS = 3;
const CODIGO_VALIDO = /^[A-Z0-9_]{3,40}$/;

export type ResultadoDoFavorito = { lista: string[]; cheio: boolean };

// Marca ou desmarca um bolo. Se já tiver 3, não marca e avisa ("cheio").
export function alternarFavorito(lista: string[], codigo: string): ResultadoDoFavorito {
  if (lista.includes(codigo)) return { lista: lista.filter((item) => item !== codigo), cheio: false };
  if (lista.length >= MAXIMO_DE_FAVORITOS) return { lista, cheio: true };
  return { lista: [...lista, codigo], cheio: false };
}

// Lê a lista guardada (ou a do link), aceitando só códigos de bolos que existem, sem repetir, no máximo 3
export function limparFavoritos(codigos: unknown, existentes: string[] | null = null): string[] {
  if (!Array.isArray(codigos)) return [];
  const limpos: string[] = [];
  for (const codigo of codigos) {
    if (typeof codigo !== "string" || !CODIGO_VALIDO.test(codigo) || limpos.includes(codigo)) continue;
    if (existentes && !existentes.includes(codigo)) continue;
    limpos.push(codigo);
    if (limpos.length === MAXIMO_DE_FAVORITOS) break;
  }
  return limpos;
}

// "?bolos=SAFARI_001,CIRCO_001" → ["SAFARI_001", "CIRCO_001"]
export function favoritosDoLink(busca: string, existentes: string[]): string[] {
  const valor = new URLSearchParams(busca).get("bolos");
  return valor ? limparFavoritos(valor.split(","), existentes) : [];
}

// O link que a cliente manda para a família
export function linkDosFavoritos(codigos: string[]): string {
  return `${urlCompleta("/favoritos")}?bolos=${codigos.join(",")}`;
}

// Mensagem pronta para o WhatsApp (sem número: a cliente escolhe para quem mandar)
export function mensagemDosFavoritos(nomes: string[], link: string): string {
  const lista = nomes.map((nome, indice) => `${indice + 1}. ${nome}`).join("\n");
  return `Me ajuda a escolher o bolo da festa? Separei ${nomes.length === 1 ? "este" : `estes ${nomes.length}`} na Ateline:\n${lista}\n\nQual você prefere? ${link}`;
}

export function linkWhatsAppSemNumero(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
