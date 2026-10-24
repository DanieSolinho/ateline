import type { Metadata } from "next";
import Link from "next/link";
import { CardBolo } from "@/components/CardBolo";
import { Caminhos } from "@/components/home/Caminhos";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { Hero } from "@/components/home/Hero";
import { getDestaques } from "@/lib/catalogo";
import { INSTAGRAM_LOJA, WHATSAPP_LOJA } from "@/lib/contato";
import { LOJA, URL_DO_SITE, urlCompleta } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: urlCompleta("/") } };

// Dados estruturados: ajudam o Google a mostrar a loja (endereço, contato) nos resultados de busca
const dadosDaLoja = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: LOJA.nome,
  description: "Aluguel, venda e encomenda de bolos cenográficos.",
  url: `${URL_DO_SITE}/`,
  image: `${URL_DO_SITE}/opengraph-image.png`,
  telephone: `+${WHATSAPP_LOJA}`,
  sameAs: [INSTAGRAM_LOJA],
  address: {
    "@type": "PostalAddress",
    streetAddress: LOJA.rua,
    addressLocality: `${LOJA.bairro}, ${LOJA.cidade}`,
    addressRegion: LOJA.uf,
    addressCountry: "BR",
  },
};

export default async function Home() {
  const destaques = await getDestaques();

  return (
    <main>
      <script
        type="application/ld+json"
        // o replace evita que um "<" dentro dos dados feche a tag <script> antes da hora
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosDaLoja).replace(/</g, "\\u003c") }}
      />
      <Hero />
      <Caminhos />

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-semibold">Queridinhos do acervo</h2>
          <Link href="/alugar" className="font-bold text-framboesa hover:underline">
            Ver todos os bolos →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {destaques.map((bolo) => (
            <CardBolo key={bolo.codigo} bolo={bolo} />
          ))}
        </div>
      </section>

      <ComoFunciona />
    </main>
  );
}