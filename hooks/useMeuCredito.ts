import { useEffect, useState } from "react";
import { buscarMeuCredito, SEM_CREDITO, type Credito } from "@/lib/credito";

// O saldo de crédito em loja da cliente logada. Sem login, não há crédito.
// Mude "versao" para buscar de novo (ex.: depois de um cancelamento).
export function useMeuCredito(idDaCliente: string | null, versao = 0): Credito | null {
  const [buscado, setBuscado] = useState<{ chave: string; credito: Credito } | null>(null);
  const chave = `${idDaCliente}-${versao}`;

  useEffect(() => {
    if (!idDaCliente) return;
    let ativo = true;
    buscarMeuCredito().then((credito) => {
      if (ativo) setBuscado({ chave, credito: credito ?? SEM_CREDITO });
    });
    return () => {
      ativo = false;
    };
  }, [idDaCliente, chave]);

  if (!idDaCliente) return SEM_CREDITO;
  return buscado?.chave === chave ? buscado.credito : (buscado?.credito ?? null); // null = carregando
}
