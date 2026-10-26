import { useSyncExternalStore } from "react";
import { hojeIso } from "@/lib/calendario";
import { buscarReservas } from "@/lib/reservas";
import type { Reserva } from "@/types/reserva";

// A agenda mais recente, buscada no Supabase quando a página abre no navegador.
// Enquanto não chega (ou se a busca falhar), a página usa a agenda do momento em que foi publicada.
let reservasAtuais: Reserva[] | null = null;
let buscando = false;
const ouvintes = new Set<() => void>();

async function atualizar() {
  if (buscando) return;
  buscando = true;
  const novas = await buscarReservas(hojeIso());
  buscando = false;
  if (novas) {
    reservasAtuais = novas;
    ouvintes.forEach((avisar) => avisar());
  }
}

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  if (reservasAtuais === null) atualizar(); // primeira vez nesta visita: busca
  window.addEventListener("focus", atualizar); // voltou para a aba: busca de novo
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("focus", atualizar);
  };
}

export function useReservas(daPublicacao: Reserva[]): Reserva[] {
  const atuais = useSyncExternalStore(
    inscrever,
    () => reservasAtuais,
    () => null,
  );
  return atuais ?? daPublicacao;
}
