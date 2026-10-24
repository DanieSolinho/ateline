import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MontarReserva } from "@/components/bolo/MontarReserva";
import { getBases, getBoloDaVitrine, getTopos, getVitrine } from "@/lib/catalogo";
import { formatarPreco } from "@/lib/formatar";
import { getReservas } from "@/lib/reservas";
import { IMAGEM_DE_COMPARTILHAR, urlCompleta } from "@/lib/site";

// O site é estático: geramos uma página para cada bolo da vitrine na hora de publicar
export async function generateStaticParams() {
  const bolos = await getVitrine();
  return bolos.map((bolo) => ({ codigo: bolo.codigo }));
}

// Códigos que não estão na vitrine dão 404
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/bolo/[codigo]">): Promise<Metadata> {
  const { codigo } = await params;
  const bolo = await getBoloDaVitrine(codigo);
  if (!bolo) return { title: "Bolo não encontrado" };

  const descricao =
    `Bolo cenográfico ${bolo.nome}, tema ${bolo.tema}, de ${bolo.andaresMin} a ${bolo.andaresMax} andares. ` +
    `Aluguel a partir de ${formatarPreco(bolo.menorPrecoLocacao)}` +
    (bolo.menorPrecoVenda !== null ? ` e compra a partir de ${formatarPreco(bolo.menorPrecoVenda)}` : "") +
    ". Retirada na Praça Seca, RJ.";

  return {
    title: bolo.nome,
    description: descricao,
    alternates: { canonical: urlCompleta(`/bolo/${bolo.codigo}`) },
    // Ao definir openGraph aqui, a página substitui o do layout: por isso repetimos a imagem e o nome do site
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Ateline Ateliê",
      title: `${bolo.nome} | Ateline`,
      description: descricao,
      images: [IMAGEM_DE_COMPARTILHAR],
    },
  };
}

export default async function BoloPage({ params }: PageProps<"/bolo/[codigo]">) {
  const { codigo } = await params;
  const bolo = await getBoloDaVitrine(codigo);
  if (!bolo) notFound();

  const [topos, bases, reservas] = await Promise.all([
    getTopos(bolo.toposCompativeis),
    getBases(),
    getReservas(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <nav aria-label="Você está em" className="mb-6 text-sm text-ameixa-suave">
        <Link href="/" className="hover:text-framboesa">Início</Link> /{" "}
        <Link href="/alugar" className="hover:text-framboesa">Bolos para alugar</Link> / {bolo.nome}
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-rosa text-ameixa-suave md:sticky md:top-4">
          Foto em breve
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl font-bold">{bolo.nome}</h1>
            <p className="text-ameixa-suave">
              Tema {bolo.tema} · de {bolo.andaresMin} a {bolo.andaresMax} andares · Ref. {bolo.codigo}
            </p>
          </div>

          <MontarReserva bolo={bolo} topos={topos} bases={bases} reservas={reservas} />

          <section className="flex flex-col gap-2 border-t border-linha pt-6">
            <h2 className="font-display text-lg font-semibold">Cuidados com a peça alugada</h2>
            <ul className="list-disc space-y-1 pl-5 text-ameixa-suave">
              <li>Não use cola, água, tinta ou outro material no bolo.</li>
              <li>Devolva limpo e no prazo do contrato.</li>
              <li>Atraso: multa de 30% por dia sobre o valor total, descontada da taxa de segurança.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
