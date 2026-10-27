import { useSyncExternalStore } from "react";
import { buscarVendidos } from "@/lib/vendas";

// As peças vendidas, buscadas no Supabase quando a página abre (igual ao useReservas)
let vendidosAtuais: string[] | null = null;
let buscando = false;
const ouvintes = new Set<() => void>();

async function atualizar() {
  if (buscando) return;
  buscando = true;
  const novos = await buscarVendidos();
  buscando = false;
  if (novos) {
    vendidosAtuais = novos;
    ouvintes.forEach((avisar) => avisar());
  }
}

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  if (vendidosAtuais === null) atualizar();
  window.addEventListener("focus", atualizar);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("focus", atualizar);
  };
}

export function useVendidos(daPublicacao: string[]): string[] {
  const atuais = useSyncExternalStore(
    inscrever,
    () => vendidosAtuais,
    () => null,
  );
  return atuais ?? daPublicacao;
}
