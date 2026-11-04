"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { alternar, useFavoritos } from "@/hooks/useFavoritos";
import { MAXIMO_DE_FAVORITOS } from "@/lib/favoritos";

type Props = { codigo: string; nome: string; variante?: "sobre-foto" | "botao" };

// Coração para separar o bolo nos favoritos (até 3)
export function BotaoFavorito({ codigo, nome, variante = "sobre-foto" }: Props) {
  const favoritos = useFavoritos();
  const [cheio, setCheio] = useState(false);
  const marcado = favoritos?.includes(codigo) ?? false;

  function aoClicar() {
    setCheio(!alternar(codigo));
  }

  const coracao = <Heart size={20} aria-hidden className={marcado ? "fill-framboesa text-framboesa" : ""} />;

  return (
    <>
      {variante === "sobre-foto" ? (
        <button
          type="button"
          onClick={aoClicar}
          aria-pressed={marcado}
          aria-label={`Favorito: ${nome}`}
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white"
        >
          {coracao}
        </button>
      ) : (
        <button
          type="button"
          onClick={aoClicar}
          aria-pressed={marcado}
          className="flex h-11 items-center gap-2 self-start rounded-xl border-2 border-ameixa px-4 font-bold hover:bg-blush"
        >
          {coracao} {marcado ? "Nos favoritos" : "Salvar nos favoritos"}
        </button>
      )}
      <span
        role="status"
        className={
          variante === "botao"
            ? "text-sm"
            : cheio
              ? "absolute inset-x-2 bottom-2 rounded-xl bg-white p-2 text-xs font-semibold shadow"
              : "sr-only"
        }
      >
        {cheio && (
          <>
            Você já separou {MAXIMO_DE_FAVORITOS} bolos. Tire um dos{" "}
            <Link href="/favoritos" className="font-bold text-framboesa underline">
              favoritos
            </Link>{" "}
            para salvar este.
          </>
        )}
      </span>
    </>
  );
}
