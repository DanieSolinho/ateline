import { useSyncExternalStore } from "react";
import type { Pedido } from "@/types/pedido";

// Enquanto não há back-end, o último pedido fica guardado no navegador
const CHAVE = "ateline-ultimo-pedido";
const ouvintes = new Set<() => void>();

let textoEmCache: string | null = null;
let pedidoEmCache: Pedido | null = null;

function lerPedido(): Pedido | null {
  let texto: string | null = null;
  try {
    texto = localStorage.getItem(CHAVE);
  } catch {
    // armazenamento bloqueado
  }
  if (texto !== textoEmCache) {
    textoEmCache = texto;
    try {
      pedidoEmCache = texto ? (JSON.parse(texto) as Pedido) : null;
    } catch {
      pedidoEmCache = null;
    }
  }
  return pedidoEmCache;
}

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  return () => ouvintes.delete(avisar);
}

export function salvarUltimoPedido(pedido: Pedido) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(pedido));
  } catch {
    // armazenamento bloqueado
  }
  ouvintes.forEach((avisar) => avisar());
}

// undefined = ainda carregando (servidor) · null = nenhum pedido
export function useUltimoPedido(): Pedido | null | undefined {
  return useSyncExternalStore(inscrever, lerPedido, () => undefined);
}