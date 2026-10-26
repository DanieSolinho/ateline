import type { Metadata } from "next";
import { Painel } from "@/components/painel/Painel";

export const metadata: Metadata = {
  title: "Painel da loja",
  robots: { index: false }, // só para a equipe
};

export default function PainelPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <Painel />
    </main>
  );
}
