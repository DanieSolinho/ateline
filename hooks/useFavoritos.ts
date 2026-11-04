import { useSyncExternalStore } from "react";
import { alternarFavorito, limparFavoritos } from "@/lib/favoritos";

// Os favoritos ficam no navegador da cliente (não precisa de conta)
const CHAVE = "ateline-favoritos";
const ouvintes = new Set<() => void>();
let textoEmCache: string | null = null;
let listaEmCache: string[] = [];

function ler(): string[] {
  let texto: string | null = null;
  try {
    texto = localStorage.getItem(CHAVE);
  } catch {
    // armazenamento bloqueado
  }
  if (texto !== textoEmCache) {
    textoEmCache = texto;
    try {
      listaEmCache = limparFavoritos(texto ? JSON.parse(texto) : []);
    } catch {
      listaEmCache = [];
    }
  }
  return listaEmCache;
}

function gravar(lista: string[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // sem armazenamento: o favorito vale só até recarregar
    textoEmCache = JSON.stringify(lista);
    listaEmCache = lista;
  }
  ouvintes.forEach((avisar) => avisar());
}

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  window.addEventListener("storage", avisar);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

// Marca ou desmarca. Devolve false se não deu para marcar porque já tem 3.
export function alternar(codigo: string): boolean {
  const { lista, cheio } = alternarFavorito(ler(), codigo);
  if (!cheio) gravar(lista);
  return !cheio;
}

export function substituirFavoritos(codigos: string[]) {
  gravar(limparFavoritos(codigos));
}

// null = ainda carregando (no servidor)
export function useFavoritos(): string[] | null {
  return useSyncExternalStore(inscrever, ler, () => null);
}
