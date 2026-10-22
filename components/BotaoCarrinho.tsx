"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrinho } from "@/hooks/useCarrinho";

export function BotaoCarrinho() {
  const { itens } = useCarrinho();
  const quantidade = itens?.length ?? 0;

  return (
    <Link
      href="/carrinho"
      aria-label={`Carrinho, ${quantidade} ${quantidade === 1 ? "item" : "itens"}`}
      className="relative grid size-11 place-items-center rounded-full hover:bg-blush"
    >
      <ShoppingBag size={22} strokeWidth={1.8} />
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