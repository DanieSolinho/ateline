import type { Metadata } from "next";
import Link from "next/link";
import { CardBolo } from "@/components/CardBolo";
import { getVitrine } from "@/lib/catalogo";
import { urlCompleta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Comprar",
  description:
    "Compre um bolo cenográfico da Ateline. Retire na loja, na Praça Seca, ou receba por transportadora em todo o Brasil.",
  alternates: { canonical: urlCompleta("/comprar") },
};

export default async function ComprarPage() {
  // À venda: peças em bom estado que têm preço de venda na planilha
  const bolos = (await getVitrine()).filter(
    (bolo) => bolo.menorPrecoVenda !== null && bolo.status === "disponivel",
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Comprar</h1>
      <p className="mt-2 max-w-2xl text-lg text-ameixa-suave">
        Leve o bolo para sempre. Retire grátis na loja ou receba em casa, com envio para todo o Brasil.
      </p>

      {bolos.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {bolos.map((bolo) => (
            <li key={bolo.codigo}>
              <CardBolo bolo={bolo} modo="compra" />
            </li>
          ))}
        </ul>
      ) : (
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
      )}
    </main>
  );
}
