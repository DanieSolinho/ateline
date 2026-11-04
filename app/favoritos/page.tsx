import type { Metadata } from "next";
import { Favoritos } from "@/components/favoritos/Favoritos";
import { getVitrine } from "@/lib/catalogo";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Os bolos separados para escolher com a família.",
  robots: { index: false }, // cada pessoa tem a sua lista
};

export default async function FavoritosPage() {
  const bolos = await getVitrine();
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <Favoritos bolos={bolos} />
    </main>
  );
}
