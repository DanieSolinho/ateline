import type { Metadata } from "next";
import { Confirmacao } from "@/components/checkout/Confirmacao";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false }, // página pessoal, fora do Google
};

export default function ConfirmadoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Confirmacao />
    </main>
  );
}