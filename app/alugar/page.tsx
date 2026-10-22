import { Suspense } from "react";
import type { Metadata } from "next";
import { Catalogo } from "@/components/catalogo/Catalogo";
import { getBolosParaAlugar } from "@/lib/bolos";

export const metadata: Metadata = {
  title: "Bolos para alugar | Ateline",
};

export default async function AlugarPage() {
  const bolos = await getBolosParaAlugar();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Bolos para alugar</h1>
      <Suspense fallback={<p className="mt-6 text-ameixa-suave">Carregando bolos…</p>}>
        <Catalogo bolos={bolos} />
      </Suspense>
    </main>
  );
}