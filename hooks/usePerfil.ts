import { useEffect, useState } from "react";
import { buscarPerfil, salvarPerfil, type Perfil } from "@/lib/perfil";

// O perfil da cliente logada, buscado no Supabase.
// carregando = true enquanto a busca não volta.
export function usePerfil(idDaCliente: string | null) {
  const [buscado, setBuscado] = useState<{ id: string; perfil: Perfil | null } | null>(null);

  useEffect(() => {
    if (!idDaCliente) return;
    let ativo = true; // evita gravar a resposta se a cliente sair antes de ela chegar
    buscarPerfil(idDaCliente).then((perfil) => {
      if (ativo) setBuscado({ id: idDaCliente, perfil });
    });
    return () => {
      ativo = false;
    };
  }, [idDaCliente]);

  const atual = idDaCliente && buscado?.id === idDaCliente ? buscado : null;

  async function salvar(perfil: Perfil): Promise<string | null> {
    if (!idDaCliente) return "Entre na sua conta para salvar.";
    const erro = await salvarPerfil(idDaCliente, perfil);
    if (!erro) setBuscado({ id: idDaCliente, perfil });
    return erro;
  }

  return {
    perfil: atual?.perfil ?? null,
    carregando: idDaCliente !== null && atual === null,
    salvar,
  };
}
