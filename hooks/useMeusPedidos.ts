import { useEffect, useState } from "react";
import { buscarMeusPedidos } from "@/lib/pedidos";
import type { Pedido } from "@/types/pedido";

// Os pedidos da cliente logada, buscados no Supabase
export function useMeusPedidos(idDaCliente: string | null) {
  const [buscado, setBuscado] = useState<{ id: string; pedidos: Pedido[] | null } | null>(null);

  useEffect(() => {
    if (!idDaCliente) return;
    let ativo = true;
    buscarMeusPedidos().then((pedidos) => {
      if (ativo) setBuscado({ id: idDaCliente, pedidos });
    });
    return () => {
      ativo = false;
    };
  }, [idDaCliente]);

  const atual = idDaCliente && buscado?.id === idDaCliente ? buscado : null;
  return {
    pedidos: atual?.pedidos ?? null, // null também se a busca falhar
    carregando: idDaCliente !== null && atual === null,
  };
}
