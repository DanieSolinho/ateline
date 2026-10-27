import type { Metadata } from "next";
import { ListaDeCompra } from "@/components/comprar/ListaDeCompra";
import { getVitrine } from "@/lib/catalogo";
import { getVendidos } from "@/lib/vendas";
import { urlCompleta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Comprar",
  description:
    "Compre um bolo cenográfico da Ateline. Retire na loja, na Praça Seca, ou receba por transportadora em todo o Brasil.",
  alternates: { canonical: urlCompleta("/comprar") },
};

export default async function ComprarPage() {
  // À venda: peças em bom estado que têm preço de venda na planilha
  const [vitrine, vendidos] = await Promise.all([getVitrine(), getVendidos()]);
  const bolos = vitrine.filter((bolo) => bolo.menorPrecoVenda !== null && bolo.status === "disponivel");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Comprar</h1>
      <p className="mt-2 max-w-2xl text-lg text-ameixa-suave">
        Leve o bolo para sempre. Retire grátis na loja ou receba em casa, com envio para todo o Brasil.
      </p>

      <ListaDeCompra bolos={bolos} vendidos={vendidos} />
    </main>
  );
}
