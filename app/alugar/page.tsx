import { Suspense } from "react";
import type { Metadata } from "next";
import { Catalogo } from "@/components/catalogo/Catalogo";
import { getVitrine } from "@/lib/catalogo";
import { getReservas } from "@/lib/reservas";
import { urlCompleta } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bolos para alugar",
  description:
    "Escolha um bolo cenográfico do acervo da Ateline e veja na hora se está livre na data da sua festa. Retirada na Praça Seca, RJ.",
  alternates: { canonical: urlCompleta("/alugar") },
};

export default async function AlugarPage() {
  const [bolos, reservas] = await Promise.all([getVitrine(), getReservas()]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Bolos para alugar</h1>
      <Suspense fallback={<p className="mt-6 text-ameixa-suave">Carregando bolos…</p>}>
        <Catalogo bolos={bolos} reservas={reservas} />
      </Suspense>
    </main>
  );
}