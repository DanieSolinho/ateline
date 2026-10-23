import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { BotaoCarrinho } from "@/components/BotaoCarrinho";
import { MenuCelular } from "@/components/MenuCelular";
import { LINKS_DO_MENU } from "@/lib/navegacao";
import logo from "@/public/logo-ateline.png";

export function Header() {
  return (
    <header className="relative border-b border-linha">
      {/* Faixa de aviso no topo */}
      <p className="bg-ameixa px-4 py-2 text-center text-sm text-blush">
        Aluguel com retirada na Praça Seca (RJ) · Venda com envio para todo o Brasil
      </p>

      <div className="mx-auto flex max-w-7xl items-center gap-x-8 px-4 py-3">
        <MenuCelular />

        <Link href="/" aria-label="Ateline, página inicial">
          <Image src={logo} alt="Ateline" width={80} height={64} priority />
        </Link>

        {/* No computador o menu fica ao lado da logo; no celular ele abre pelo botão ☰ */}
        <nav aria-label="Principal" className="hidden flex-1 gap-x-6 text-[15px] font-semibold md:flex">
          {LINKS_DO_MENU.map((link) => (
            <Link key={link.href} href={link.href} className="py-2 hover:text-framboesa">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex gap-1">
          <Link
            href="/conta"
            aria-label="Minha conta"
            className="hidden size-11 place-items-center rounded-full hover:bg-blush md:grid"
          >
            <UserRound size={22} strokeWidth={1.8} />
          </Link>
          <BotaoCarrinho />
        </div>
      </div>
    </header>
  );
}
