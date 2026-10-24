import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-20">
      <p className="font-display text-6xl font-bold text-framboesa">404</p>
      <h1 className="font-display text-4xl font-bold">Essa página não existe</h1>
      <p className="text-lg text-ameixa-suave">
        O endereço pode ter mudado, ou o bolo saiu do acervo. Que tal ver os bolos disponíveis?
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/alugar"
          className="grid h-12 place-items-center rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura"
        >
          Ver bolos para alugar
        </Link>
        <Link href="/" className="grid h-12 place-items-center rounded-xl border-2 border-ameixa px-6 font-bold hover:bg-blush">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
