import { useEffect, useState } from "react";
import { souDaEquipe } from "@/lib/painel";

// A cliente logada faz parte da equipe da loja? (null = ainda verificando)
export function useEquipe(idDaPessoa: string | null): boolean | null {
  const [resposta, setResposta] = useState<{ id: string; equipe: boolean } | null>(null);

  useEffect(() => {
    if (!idDaPessoa) return;
    let ativo = true;
    souDaEquipe().then((equipe) => {
      if (ativo) setResposta({ id: idDaPessoa, equipe });
    });
    return () => {
      ativo = false;
    };
  }, [idDaPessoa]);

  if (!idDaPessoa) return false;
  return resposta?.id === idDaPessoa ? resposta.equipe : null;
}
