import type { Metadata } from "next";
import { Carrinho } from "@/components/carrinho/Carrinho";

export const metadata: Metadata = {
  title: "Seu pedido",
  robots: { index: false }, // página pessoal, fora do Google
};

export default function CarrinhoPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Seu pedido</h1>
      <Carrinho />
    </main>
  );
}