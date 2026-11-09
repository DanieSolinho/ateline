// Fotos dos bolos no site.
// O comando "npm run fotos" lê as pastas em dados-fonte/fotos, deixa as fotos leves (formato WebP)
// e guarda em public/fotos/<CÓDIGO>/. A lista do que existe fica em data/fotos.json:
// { "ABELHINHA_001": ["3f2a91c0", "b81d44e2"] } → 2 fotos; cada texto é a "versão" da foto,
// que muda quando a foto é trocada (assim o navegador não mostra a antiga guardada).
import listaDeFotos from "@/data/fotos.json";

export type MapaDeFotos = Record<string, string[]>;
export type FotoDoBolo = { grande: string; pequena: string; alt: string };

const FOTOS = listaDeFotos as MapaDeFotos;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""; // "/ateline" no GitHub, "" no seu Mac

// "ABELHINHA_001", 1, "pequena" → "/ateline/fotos/ABELHINHA_001/ABELHINHA_001-01-p.webp?v=3f2a91c0"
export function caminhoDaFoto(
  codigo: string,
  numero: number,
  tamanho: "grande" | "pequena",
  versao: string,
  base = BASE,
): string {
  const nn = String(numero).padStart(2, "0");
  const sufixo = tamanho === "pequena" ? "-p" : "";
  return `${base}/fotos/${codigo}/${codigo}-${nn}${sufixo}.webp?v=${versao}`;
}

// Todas as fotos de um bolo (ou de uma opção), na ordem -01, -02…
export function fotosDe(codigo: string, alt: string, mapa: MapaDeFotos = FOTOS, base = BASE): FotoDoBolo[] {
  const versoes = mapa[codigo] ?? [];
  return versoes.map((versao, i) => ({
    grande: caminhoDaFoto(codigo, i + 1, "grande", versao, base),
    pequena: caminhoDaFoto(codigo, i + 1, "pequena", versao, base),
    alt: versoes.length > 1 ? `${alt}, foto ${i + 1} de ${versoes.length}` : alt,
  }));
}

// A foto do cartão: a -01 do bolo. Sem foto do bolo, a -01 da primeira opção que tiver.
export function fotoDoCartao(
  codigo: string,
  codigosDasOpcoes: string[] = [],
  mapa: MapaDeFotos = FOTOS,
  base = BASE,
): string | undefined {
  const comFoto = [codigo, ...codigosDasOpcoes].find((c) => (mapa[c]?.length ?? 0) > 0);
  return comFoto ? caminhoDaFoto(comFoto, 1, "pequena", mapa[comFoto][0], base) : undefined;
}

// Descrição da opção para o texto alternativo: "Abelhinha, 3 andares, Flores"
export function nomeDaOpcao(nomeDoBolo: string, andares: number, decoracao: string | null): string {
  return [nomeDoBolo, `${andares} andares`, decoracao].filter(Boolean).join(", ");
}
