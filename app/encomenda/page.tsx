import type { Metadata } from "next";
import { FormularioEncomenda } from "@/components/encomenda/FormularioEncomenda";
import { getCupomRefazer, getRefaziveis } from "@/lib/catalogo";
import { urlCompleta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Encomende o seu",
  description:
    "Peça um bolo cenográfico novo, com o tema e as cores da sua festa, para alugar ou comprar. Orçamento pelo WhatsApp.",
  alternates: { canonical: urlCompleta("/encomenda") },
};

export default async function EncomendaPage() {
  const [refaziveis, cupom] = await Promise.all([getRefaziveis(), getCupomRefazer()]);

  return (
    <main>
      <section className="bg-blush">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12">
          <h1 className="max-w-3xl font-display text-4xl font-bold text-balance md:text-5xl">
            Um bolo novo, feito do jeito que você imaginou
          </h1>
          <p className="max-w-2xl text-lg text-ameixa-suave">
            Conte o tema, as cores e o tamanho. A Ateline responde no WhatsApp com o valor e, se você aprovar, é
            só pagar o sinal.
          </p>
          <p className="max-w-2xl text-ameixa-suave">
            Você pode encomendar para <strong className="text-ameixa">alugar</strong> (a primeira locação é sua)
            ou para <strong className="text-ameixa">comprar</strong> e ficar com o bolo.
          </p>
        </div>
      </section>

      <FormularioEncomenda refaziveis={refaziveis} cupom={cupom} />
    </main>
  );
}
