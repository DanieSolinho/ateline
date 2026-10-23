import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlugarOuComprar } from "@/components/bolo/AlugarOuComprar";
import { getBolo, getBolos } from "@/lib/bolos";
import { getReservas } from "@/lib/reservas";

// O site é estático: geramos uma página para cada bolo na hora de publicar
export async function generateStaticParams() {
  const bolos = await getBolos();
  return bolos.map((bolo) => ({ codigo: bolo.codigo }));
}

// Códigos que não estão na lista dão 404
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/bolo/[codigo]">): Promise<Metadata> {
  const { codigo } = await params;
  const bolo = await getBolo(codigo);
  return { title: bolo ? `${bolo.nome} | Ateline` : "Bolo não encontrado | Ateline" };
}

export default async function BoloPage({ params }: PageProps<"/bolo/[codigo]">) {
  const { codigo } = await params;
  const bolo = await getBolo(codigo);
  if (!bolo) notFound();

  const reservas = (await getReservas()).filter((reserva) => reserva.codigo === codigo);
  const detalhe =
    bolo.tipo === "bolo"
      ? `${bolo.andares} ${bolo.andares === 1 ? "andar" : "andares"}`
      : bolo.itensKit?.join(", ");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <nav aria-label="Você está em" className="mb-6 text-sm text-ameixa-suave">
        <Link href="/" className="hover:text-framboesa">Início</Link> /{" "}
        <Link href="/alugar" className="hover:text-framboesa">Bolos para alugar</Link> / {bolo.nome}
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-rosa text-ameixa-suave">
          Foto em breve
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl font-bold">{bolo.nome}</h1>
            <p className="text-ameixa-suave">
              Ref. {bolo.codigo}
              {detalhe && ` · ${detalhe}`}
            </p>
          </div>

          <AlugarOuComprar bolo={bolo} reservas={reservas} />

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