import Link from "next/link";
import { CardBolo } from "@/components/CardBolo";
import { Caminhos } from "@/components/home/Caminhos";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { Hero } from "@/components/home/Hero";
import { getDestaques } from "@/lib/bolos";

export default async function Home() {
  const destaques = await getDestaques();

  return (
    <main>
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