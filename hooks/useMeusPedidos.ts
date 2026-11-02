import { useCallback, useEffect, useState } from "react";
import { buscarMeusPedidos } from "@/lib/pedidos";
import type { Pedido } from "@/types/pedido";

// Os pedidos da cliente logada, buscados no Supabase.
// "recarregar" busca de novo (depois de um adiamento ou cancelamento).
export function useMeusPedidos(idDaCliente: string | null) {
  const [buscado, setBuscado] = useState<{ id: string; pedidos: Pedido[] | null } | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    if (!idDaCliente) return;
    let ativo = true;
    buscarMeusPedidos().then((pedidos) => {
      if (ativo) setBuscado({ id: idDaCliente, pedidos });
    });
    return () => {
      ativo = false;
    };
  }, [idDaCliente, versao]);

  const recarregar = useCallback(() => setVersao((atual) => atual + 1), []);
  const atual = idDaCliente && buscado?.id === idDaCliente ? buscado : null;
  return {
    pedidos: atual?.pedidos ?? null, // null também se a busca falhar
    carregando: idDaCliente !== null && atual === null,
    recarregar,
  };
}
