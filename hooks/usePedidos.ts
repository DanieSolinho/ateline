import { useSyncExternalStore } from "react";
import type { Pedido } from "@/types/pedido";

// Enquanto não há back-end, os pedidos ficam guardados no navegador da cliente.
// Com o back-end, esta lista passa a vir do banco de dados, e as telas continuam iguais.
const CHAVE = "ateline-pedidos";
const ouvintes = new Set<() => void>();

// Mesmo truque do carrinho: devolver sempre o MESMO array enquanto o texto guardado não mudar
let textoEmCache: string | null = null;
let pedidosEmCache: Pedido[] = [];

function lerPedidos(): Pedido[] {
  let texto: string | null = null;
  try {
    texto = localStorage.getItem(CHAVE);
  } catch {
    // armazenamento bloqueado
  }
  if (texto !== textoEmCache) {
    textoEmCache = texto;
    try {
      pedidosEmCache = texto ? (JSON.parse(texto) as Pedido[]) : [];
    } catch {
      pedidosEmCache = [];
    }
  }
  return pedidosEmCache;
}

function gravar(pedidos: Pedido[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(pedidos));
  } catch {
    // armazenamento bloqueado
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

export function salvarPedido(pedido: Pedido) {
  gravar([...lerPedidos(), pedido]);
}

// Botão "Apagar meus dados deste navegador"
export function apagarPedidos() {
  gravar([]);
}

// null = ainda carregando (servidor)
export function usePedidos(): Pedido[] | null {
  return useSyncExternalStore(inscrever, lerPedidos, () => null);
}

// undefined = ainda carregando · null = nenhum pedido
export function useUltimoPedido(): Pedido | null | undefined {
  const pedidos = usePedidos();
  if (pedidos === null) return undefined;
  return pedidos.at(-1) ?? null;
}
