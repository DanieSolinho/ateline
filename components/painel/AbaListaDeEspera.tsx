"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { diaPorExtenso } from "@/lib/calendario";
import { nomeDaPeca } from "@/lib/catalogo";
import { linkWhatsApp } from "@/lib/contato";
import { formatarTelefone } from "@/lib/formatar";
import { buscarListaDeEspera, marcarEspera, mensagemDeAvisoDeEspera, type EntradaDeEspera } from "@/lib/espera";
import { urlCompleta } from "@/lib/site";

export function AbaListaDeEspera() {
  const [versao, setVersao] = useState(0);
  const [lista, setLista] = useState<{ versao: number; entradas: EntradaDeEspera[] | null } | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarListaDeEspera().then((entradas) => ativo && setLista({ versao, entradas }));
    return () => {
      ativo = false;
    };
  }, [versao]);

  if (!lista) return <p className="text-ameixa-suave">Carregando…</p>;
  if (lista.entradas === null) {
    return (
      <p role="alert" className="rounded-xl bg-[#fce9df] p-4 font-semibold text-alerta">
        Não deu para carregar a lista de espera. Confira a internet e tente de novo.
      </p>
    );
  }

  const liberadas = lista.entradas.filter((e) => e.liberou);
  const esperando = lista.entradas.filter((e) => !e.liberou);
  const atualizar = () => setVersao((v) => v + 1);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section aria-labelledby="espera-liberou" className="flex flex-col gap-3 rounded-2xl bg-[#e6f2ea] p-4">
        <h2 id="espera-liberou" className="font-display text-xl font-semibold">
          Liberou: avisar agora <span className="font-medium text-ameixa-suave">· {liberadas.length}</span>
        </h2>
        {liberadas.length === 0 ? (
          <p className="text-sm text-ameixa-suave">Nenhuma data liberou por enquanto.</p>
        ) : (
          liberadas.map((entrada) => <CartaoEspera key={entrada.id} entrada={entrada} aoMudar={atualizar} />)
        )}
      </section>

      <section aria-labelledby="espera-aguardando" className="flex flex-col gap-3 rounded-2xl bg-blush/50 p-4">
        <h2 id="espera-aguardando" className="font-display text-xl font-semibold">
          Esperando a data liberar <span className="font-medium text-ameixa-suave">· {esperando.length}</span>
        </h2>
        {esperando.length === 0 ? (
          <p className="text-sm text-ameixa-suave">Ninguém na lista de espera.</p>
        ) : (
          esperando.map((entrada) => <CartaoEspera key={entrada.id} entrada={entrada} aoMudar={atualizar} />)
        )}
      </section>
    </div>
  );
}

function CartaoEspera({ entrada, aoMudar }: { entrada: EntradaDeEspera; aoMudar: () => void }) {
  const [erro, setErro] = useState("");
  const bolo = nomeDaPeca(entrada.codigo);
  const dia = diaPorExtenso(entrada.festa);
  const link = `${urlCompleta(`/bolo/${entrada.codigo}`)}?festa=${entrada.festa}`;
  const whatsapp = linkWhatsApp(mensagemDeAvisoDeEspera(entrada.nome, bolo, dia, link), `55${entrada.whatsapp}`);

  async function marcar(acao: "avisado" | "remover") {
    const falha = await marcarEspera(entrada.id, acao);
    if (falha) return setErro(falha);
    aoMudar();
  }

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-linha bg-white p-4">
      <strong>
        {bolo} · festa {dia}
      </strong>
      <p className="text-sm text-ameixa-suave">
        {entrada.nome} · {formatarTelefone(entrada.whatsapp)}
      </p>
      {erro && (
        <p role="alert" className="text-sm font-semibold text-alerta">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {entrada.liberou && whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener"
            className="flex h-11 items-center gap-2 rounded-xl bg-folha px-4 font-bold text-white hover:opacity-90"
          >
            <MessageCircle size={18} aria-hidden /> Avisar no WhatsApp
          </a>
        )}
        {entrada.liberou && (
          <button
            type="button"
            onClick={() => marcar("avisado")}
            className="h-11 rounded-xl border-2 border-ameixa px-4 font-bold hover:bg-blush"
          >
            Já avisei
          </button>
        )}
        <button
          type="button"
          onClick={() => marcar("remover")}
          className="h-11 rounded-xl px-3 text-sm font-bold underline"
        >
          Tirar da lista
        </button>
      </div>
    </article>
  );
}
