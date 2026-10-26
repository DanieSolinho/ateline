import { supabase } from "@/lib/supabase";
import type { Reserva } from "@/types/reserva";

// Uma linha da tabela "reservas" do Supabase (só as colunas que o site usa)
export type LinhaDeReserva = { codigo: string; festa: string };

export function converterReservas(linhas: LinhaDeReserva[]): Reserva[] {
  return linhas.map((linha) => ({ codigo: linha.codigo, festa: linha.festa }));
}

// Busca no banco as reservas que ainda importam: as que terminam de hoje em diante.
// Devolve null se a busca falhar (sem internet, banco fora do ar), para quem chamou decidir o que fazer.
export async function buscarReservas(hoje: string): Promise<Reserva[] | null> {
  const { data, error } = await supabase
    .from("reservas")
    .select("codigo, festa")
    .gte("devolucao", hoje)
    .order("festa");

  if (error || !data) {
    console.warn("Não deu para buscar as reservas no Supabase:", error?.message);
    return null;
  }
  return converterReservas(data);
}

// Na hora de publicar (build), a página já sai com a agenda daquele momento.
// No navegador, o hook useReservas busca de novo e atualiza.
export async function getReservas(): Promise<Reserva[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  return (await buscarReservas(hoje)) ?? [];
}
