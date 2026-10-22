import type { Metadata } from "next";
import { Carrinho } from "@/components/carrinho/Carrinho";

export const metadata: Metadata = {
  title: "Sua reserva | Ateline",
};

export default function CarrinhoPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Sua reserva</h1>
      <Carrinho />
    </main>
  );
}