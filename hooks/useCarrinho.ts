import { useSyncExternalStore } from "react";
import { carrinhoReducer } from "@/lib/carrinho";
import type { AcaoCarrinho, ItemCarrinho } from "@/types/carrinho";

// O carrinho fica guardado no navegador (localStorage), então sobrevive a recarregar a página.
// "v3": o carrinho passou a ter compras; carrinhos antigos guardados no navegador são ignorados
const CHAVE = "ateline-carrinho-v3";
const ouvintes = new Set<() => void>();

// Guardamos o último texto lido para devolver sempre o MESMO array enquanto nada mudar.
// O useSyncExternalStore exige isso, senão a tela redesenha sem parar.
let textoEmCache: string | null = null;
let itensEmCache: ItemCarrinho[] = [];

function lerCarrinho(): ItemCarrinho[] {
  let texto: string | null = null;
  try {
    texto = localStorage.getItem(CHAVE);
  } catch {
    // navegador bloqueou o armazenamento: seguimos com o que já temos
  }
  if (texto !== textoEmCache) {
    textoEmCache = texto;
    try {
      itensEmCache = texto ? (JSON.parse(texto) as ItemCarrinho[]) : [];
    } catch {
      itensEmCache = [];
    }
  }
  return itensEmCache;
}

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  window.addEventListener("storage", avisar); // mudanças feitas em outra aba
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

function despachar(acao: AcaoCarrinho) {
  const novos = carrinhoReducer(lerCarrinho(), acao);
  try {
    localStorage.setItem(CHAVE, JSON.stringify(novos));
  } catch {
    // sem armazenamento disponível
  }
  ouvintes.forEach((avisar) => avisar());
}

// No servidor não existe carrinho: devolvemos null e a tela mostra "Carregando…"
const carrinhoNoServidor = () => null;

export function useCarrinho() {
  const itens = useSyncExternalStore(inscrever, lerCarrinho, carrinhoNoServidor);

  return {
    itens, // null enquanto carrega no navegador
    adicionar: (item: ItemCarrinho) => despachar({ tipo: "adicionar", item }),
    remover: (chave: string) => despachar({ tipo: "remover", chave }),
    esvaziar: () => despachar({ tipo: "esvaziar" }),
  };
}