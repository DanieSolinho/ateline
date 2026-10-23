import type { Metadata } from "next";
import { Outfit, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { BotaoWhatsApp } from "@/components/BotaoWhatsApp";
import { Footer } from "@/components/Footer";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ateline | Bolos cenográficos no Rio de Janeiro",
  description:
    "Aluguel e venda de bolos cenográficos, kits pegue e monte e encomendas personalizadas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${nunito.variable} h-full antialiased`}
    >
    <body className="min-h-full flex flex-col font-sans">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <BotaoWhatsApp />
    </body>
    </html>
  );
}