import type { Metadata } from "next";
import { Outfit, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { BotaoWhatsApp } from "@/components/BotaoWhatsApp";
import { Footer } from "@/components/Footer";
import { ORIGEM } from "@/lib/site";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });

const descricao =
  "Aluguel, venda e encomenda de bolos cenográficos na Praça Seca, Rio de Janeiro. Reserve pela data da festa e retire na loja.";

export const metadata: Metadata = {
  // Base para os links absolutos. Só a origem: o Next já acrescenta o "/ateline" (basePath) sozinho.
  metadataBase: new URL(ORIGEM),
  title: {
    default: "Ateline | Bolos cenográficos no Rio de Janeiro",
    template: "%s | Ateline", // cada página só informa a primeira parte do título
  },
  description: descricao,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Ateline Ateliê",
    title: "Ateline | Bolos cenográficos no Rio de Janeiro",
    description: descricao,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${nunito.variable} h-full antialiased`}
    >
    <body className="min-h-full flex flex-col font-sans">
      {/* Primeiro item do Tab: quem navega pelo teclado pula o menu e vai direto ao conteúdo */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-ameixa focus:px-4 focus:py-3 focus:font-bold focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <div id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </div>
      <Footer />
      <BotaoWhatsApp />
    </body>
    </html>
  );
}