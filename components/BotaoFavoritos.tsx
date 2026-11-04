"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavoritos } from "@/hooks/useFavoritos";

// Coração no topo do site: abre os favoritos, com quantos já foram separados
export function BotaoFavoritos() {
  const quantidade = useFavoritos()?.length ?? 0;
  return (
    <Link
      href="/favoritos"
      aria-label={`Favoritos, ${quantidade} ${quantidade === 1 ? "bolo" : "bolos"}`}
      className="relative grid size-11 place-items-center rounded-full hover:bg-blush"
    >
      <Heart size={22} strokeWidth={1.8} />
      {quantidade > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-framboesa text-xs font-bold text-white"
        >
          {quantidade}
        </span>
      )}
    </Link>
  );
}
