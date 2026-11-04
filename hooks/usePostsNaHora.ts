import { useCallback, useEffect, useState } from "react";
import { buscarPosts, momentoDoAgendado } from "@/lib/instagram";

// Quantos posts aprovados já estão na hora de postar (para o aviso na aba Instagram).
// Confere de novo a cada 5 minutos com o painel aberto.
export function usePostsNaHora(): [number, () => void] {
  const [quantos, setQuantos] = useState(0);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    async function conferir() {
      const posts = await buscarPosts();
      if (!ativo || !posts) return;
      const agora = new Date();
      setQuantos(
        posts.filter((post) => post.status === "agendado" && post.agendadoPara && momentoDoAgendado(post.agendadoPara, agora) === "postar").length,
      );
    }
    conferir();
    const intervalo = setInterval(conferir, 5 * 60_000);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [versao]);

  const atualizar = useCallback(() => setVersao((atual) => atual + 1), []);
  return [quantos, atualizar];
}
