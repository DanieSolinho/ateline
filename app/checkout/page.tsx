import type { Metadata } from "next";
import { FormularioCheckout } from "@/components/checkout/FormularioCheckout";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  robots: { index: false }, // página pessoal, fora do Google
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold">Finalizar pedido</h1>
      <FormularioCheckout />
    </main>
  );
}