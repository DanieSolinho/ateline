import { estaDisponivel } from "@/lib/periodo";
import type { BoloVitrine } from "@/types/catalogo";
import type { Reserva } from "@/types/reserva";

// Outros bolos livres numa data, para quem encontrou o bolo escolhido ocupado.
// Ordem: mesmo tema primeiro; depois, o preço mais parecido com o do bolo escolhido.
export function bolosLivresNaData(
  bolos: BoloVitrine[],
  festa: string,
  reservas: Reserva[],
  escolhido: Pick<BoloVitrine, "codigo" | "tema" | "menorPrecoLocacao">,
  limite = 4,
): BoloVitrine[] {
  const mesmoTema = (bolo: BoloVitrine) => (bolo.tema === escolhido.tema ? 0 : 1);
  const distanciaDePreco = (bolo: BoloVitrine) => Math.abs(bolo.menorPrecoLocacao - escolhido.menorPrecoLocacao);

  return bolos
    .filter((bolo) => bolo.codigo !== escolhido.codigo && estaDisponivel(bolo.codigo, festa, reservas))
    .sort((a, b) => mesmoTema(a) - mesmoTema(b) || distanciaDePreco(a) - distanciaDePreco(b))
    .slice(0, limite);
}

// A data que veio no link (?festa=2026-11-21), se for uma data válida
export function festaDoEndereco(busca: string): string | null {
  const festa = new URLSearchParams(busca).get("festa");
  return festa && /^\d{4}-\d{2}-\d{2}$/.test(festa) ? festa : null;
}
