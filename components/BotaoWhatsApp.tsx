"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { linkWhatsApp, mensagemDaPagina } from "@/lib/contato";

export function BotaoWhatsApp() {
  const caminho = usePathname();
  const link = linkWhatsApp(mensagemDaPagina(caminho));

  if (!link) return null; // sem número cadastrado, não mostra nada

  // O <aside> deixa o botão dentro de uma "região" da página, para quem navega por leitor de tela
  return (
    <aside aria-label="Atendimento">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale com a gente no WhatsApp"
        className="fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full bg-[#1f7a4d] px-5 py-3.5 font-bold text-white shadow-lg hover:bg-[#186540] md:right-6 md:bottom-6"
      >
        <MessageCircle size={22} aria-hidden="true" />
        <span className="hidden sm:inline">Fale com a gente</span>
      </a>
    </aside>
  );
}
