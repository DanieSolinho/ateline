"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LINKS_DO_MENU } from "@/lib/navegacao";

export function MenuCelular() {
  const [aberto, setAberto] = useState(false);
  const fechar = () => setAberto(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="menu-celular"
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        onClick={() => setAberto(!aberto)}
        className="grid size-11 place-items-center rounded-full hover:bg-blush"
      >
        {aberto ? <X size={24} /> : <Menu size={24} />}
      </button>

      {aberto && (
        <nav
          id="menu-celular"
          aria-label="Principal"
          onKeyDown={(evento) => evento.key === "Escape" && fechar()}
          className="absolute inset-x-0 top-full z-20 border-b border-linha bg-white px-4 pb-4 shadow-lg"
        >
          <ul className="flex flex-col">
            {LINKS_DO_MENU.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={fechar}
                  className="block border-b border-linha py-4 text-lg font-semibold hover:text-framboesa">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/conta" onClick={fechar} className="block py-4 text-lg font-semibold hover:text-framboesa">
                Minha conta
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
