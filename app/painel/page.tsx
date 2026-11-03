import type { Metadata, Viewport } from "next";
import { Painel } from "@/components/painel/Painel";

// O caminho do site no GitHub Pages ("/ateline") ou vazio no computador
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Painel da loja",
  robots: { index: false }, // só para a equipe
  // Só o painel pode ser instalado como app no celular (as páginas das clientes, não)
  manifest: `${base}/painel.webmanifest`,
  appleWebApp: { capable: true, title: "Painel Ateline", statusBarStyle: "default" },
  icons: { apple: `${base}/icones/painel-180.png` },
};

export const viewport: Viewport = { themeColor: "#b8294f" };

export default function PainelPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <Painel />
    </main>
  );
}
