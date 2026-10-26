import type { Metadata } from "next";
import { FormularioEntrar } from "@/components/conta/FormularioEntrar";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false }, // página pessoal, fora do Google
};

export default function EntrarPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Entrar</h1>
      <p className="mt-2 text-lg text-ameixa-suave">
        Sem senha: mandamos um link para o seu e-mail. É só clicar nele para entrar.
      </p>
      <FormularioEntrar />
    </main>
  );
}
