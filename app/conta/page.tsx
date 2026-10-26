import type { Metadata } from "next";
import { MinhaConta } from "@/components/conta/MinhaConta";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false }, // página pessoal, fora do Google
};

export default function ContaPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <MinhaConta />
      <p className="mt-12 text-sm text-ameixa-suave">
        Sem login, os pedidos ficam guardados só neste navegador. Entre na sua conta para vê-los em qualquer aparelho.
      </p>
    </main>
  );
}
