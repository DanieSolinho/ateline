"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Heart, MessageCircle } from "lucide-react";
import { CardBolo } from "@/components/CardBolo";
import { substituirFavoritos, useFavoritos } from "@/hooks/useFavoritos";
import {
  favoritosDoLink,
  linkDosFavoritos,
  linkWhatsAppSemNumero,
  MAXIMO_DE_FAVORITOS,
  mensagemDosFavoritos,
} from "@/lib/favoritos";
import type { BoloVitrine } from "@/types/catalogo";

type Props = { bolos: BoloVitrine[] };

// Os bolos separados pela cliente, ou os que alguém mandou pelo link para pedir opinião
export function Favoritos({ bolos }: Props) {
  const meus = useFavoritos();
  const [doLink, setDoLink] = useState<string[] | null>(null); // bolos que vieram no link compartilhado
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const espera = setTimeout(() => {
      const codigos = favoritosDoLink(window.location.search, bolos.map((bolo) => bolo.codigo));
      setDoLink(codigos.length > 0 ? codigos : null);
    }, 0);
    return () => clearTimeout(espera);
  }, [bolos]);

  if (meus === null) return <p className="text-ameixa-suave">Carregando…</p>;

  const codigos = doLink ?? meus;
  const escolhidos = codigos
    .map((codigo) => bolos.find((bolo) => bolo.codigo === codigo))
    .filter((bolo): bolo is BoloVitrine => Boolean(bolo));
  const link = linkDosFavoritos(codigos);
  const mensagem = mensagemDosFavoritos(escolhidos.map((bolo) => bolo.nome), link);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
    } catch {
      // sem permissão: o botão do WhatsApp continua funcionando
    }
  }

  // Quem recebeu o link
  if (doLink) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold">Me ajuda a escolher?</h1>
          <p className="text-lg text-ameixa-suave">
            Alguém separou {escolhidos.length === 1 ? "este bolo" : `estes ${escolhidos.length} bolos`} para a festa e
            quer a sua opinião. Responda pelo WhatsApp dizendo qual você prefere.
          </p>
        </div>
        <Grade bolos={escolhidos} />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              substituirFavoritos(doLink);
              window.history.replaceState(null, "", window.location.pathname);
              setDoLink(null);
            }}
            className="flex h-12 items-center gap-2 rounded-xl border-2 border-ameixa px-5 font-bold hover:bg-blush"
          >
            <Heart size={18} aria-hidden /> Guardar estes nos meus favoritos
          </button>
          <Link href="/alugar" className="flex h-12 items-center rounded-xl px-5 font-bold text-framboesa underline">
            Ver todos os bolos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold">Meus favoritos</h1>
        <p className="text-lg text-ameixa-suave">
          Separe até {MAXIMO_DE_FAVORITOS} bolos tocando no coração e mande para alguém da família ajudar a escolher.
        </p>
      </div>

      {escolhidos.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-linha p-8">
          <p className="text-lg">Você ainda não separou nenhum bolo.</p>
          <p className="text-ameixa-suave">
            Toque no <Heart size={16} aria-label="coração" className="inline align-[-2px]" /> de um bolo no catálogo para
            ele aparecer aqui.
          </p>
          <Link
            href="/alugar"
            className="grid h-12 place-items-center rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura"
          >
            Ver bolos para alugar
          </Link>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="compartilhar-titulo"
            className="flex flex-col items-start gap-3 rounded-2xl bg-blush p-5"
          >
            <h2 id="compartilhar-titulo" className="font-display text-xl font-semibold">
              Mande para a família ajudar a escolher
            </h2>
            <p className="text-ameixa-suave">
              Quem abrir o link vê {escolhidos.length === 1 ? "o bolo" : `os ${escolhidos.length} bolos`} lado a lado,
              com fotos, tamanhos e preços.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={linkWhatsAppSemNumero(mensagem)}
                target="_blank"
                rel="noopener"
                className="flex h-12 items-center gap-2 rounded-xl bg-folha px-5 font-bold text-white hover:opacity-90"
              >
                <MessageCircle size={20} aria-hidden /> Mandar pelo WhatsApp
              </a>
              <button
                type="button"
                onClick={copiar}
                className="flex h-12 items-center gap-2 rounded-xl border-2 border-ameixa px-5 font-bold hover:bg-white"
              >
                {copiado ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                {copiado ? "Link copiado" : "Copiar link"}
              </button>
            </div>
          </section>
          <Grade bolos={escolhidos} />
          {escolhidos.length < MAXIMO_DE_FAVORITOS && (
            <Link href="/alugar" className="self-start font-bold text-framboesa hover:underline">
              Separar mais {MAXIMO_DE_FAVORITOS - escolhidos.length === 1 ? "1 bolo" : `${MAXIMO_DE_FAVORITOS - escolhidos.length} bolos`}
            </Link>
          )}
        </>
      )}
    </div>
  );
}

// Os bolos lado a lado (2 no celular, 3 no computador)
function Grade({ bolos }: { bolos: BoloVitrine[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 md:grid-cols-3">
      {bolos.map((bolo) => (
        <CardBolo key={bolo.codigo} bolo={bolo} />
      ))}
    </div>
  );
}
