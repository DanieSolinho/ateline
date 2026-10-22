import { CardBolo } from "@/components/CardBolo";
import { getDestaques } from "@/lib/bolos";

export default async function Home() {
  const destaques = await getDestaques();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12">
      <h2 className="mb-8 font-display text-3xl font-semibold">Queridinhos do acervo</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        {destaques.map((bolo) => (
          <CardBolo key={bolo.codigo} bolo={bolo} />
        ))}
      </div>
    </main>
  );
}