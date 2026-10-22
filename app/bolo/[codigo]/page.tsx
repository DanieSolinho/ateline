import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { CalendarioReserva } from "@/components/bolo/CalendarioReserva";
import { getBolo, getBolos } from "@/lib/bolos";
import { formatarPreco } from "@/lib/formatar";
import { getReservas } from "@/lib/reservas";
import { TAXA_SEGURANCA } from "@/lib/regras";

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
  const ehVenda = bolo.modalidade === "venda";
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

          {ehVenda ? (
            <div className="flex flex-col gap-4">
              {bolo.precoVenda !== undefined && (
                <p className="font-display text-3xl font-bold">{formatarPreco(bolo.precoVenda)}</p>
              )}
              <p className="flex items-center gap-2 font-bold">
                <Truck size={18} /> Envio para todo o Brasil
              </p>
              <button
                type="button"
                disabled
                className="h-14 rounded-xl bg-framboesa text-lg font-bold text-white opacity-50"
              >
                Comprar (em breve)
              </button>
            </div>
          ) : (
            <>
              {bolo.precoLocacao !== undefined && (
                <p>
                  <span className="font-display text-3xl font-bold">{formatarPreco(bolo.precoLocacao)}</span>{" "}
                  <span className="font-semibold text-ameixa-suave">
                    por locação · + {formatarPreco(TAXA_SEGURANCA)} de taxa de segurança, devolvida
                  </span>
                </p>
              )}
              <CalendarioReserva bolo={bolo} reservas={reservas} />
            </>
          )}

          <section className="flex flex-col gap-2 border-t border-linha pt-6">
            <h2 className="font-display text-lg font-semibold">Cuidados com a peça</h2>
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