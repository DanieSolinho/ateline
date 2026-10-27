"use client";

import Link from "next/link";
import { CardBolo } from "@/components/CardBolo";
import { useVendidos } from "@/hooks/useVendidos";
import type { BoloVitrine } from "@/types/catalogo";

// A lista da página Comprar, sem os bolos que acabaram de ser vendidos
export function ListaDeCompra({ bolos, vendidos: daPublicacao }: { bolos: BoloVitrine[]; vendidos: string[] }) {
  const vendidos = useVendidos(daPublicacao);
  const aVenda = bolos.filter((bolo) => !vendidos.includes(bolo.codigo));

  if (aVenda.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-linha p-8">
        <p className="text-lg">Os bolos à venda aparecem aqui em breve.</p>
        <p className="text-ameixa-suave">Enquanto isso, você pode encomendar um bolo novo para ficar com você.</p>
        <Link
          href="/encomenda"
          className="grid h-12 place-items-center rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura"
        >
          Encomendar um bolo
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {aVenda.map((bolo) => (
        <li key={bolo.codigo}>
          <CardBolo bolo={bolo} modo="compra" />
        </li>
      ))}
    </ul>
  );
}
