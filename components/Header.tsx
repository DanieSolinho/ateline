import Image from "next/image";
import logo from "@/public/logo-ateline.png";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { BotaoCarrinho } from "@/components/BotaoCarrinho";

const links = [
  { href: "/alugar", label: "Bolos para alugar" },
  { href: "/kits", label: "Kits pegue e monte" },
  { href: "/encomenda", label: "Encomende o seu" },
  { href: "/comprar", label: "Comprar" },
];

export function Header() {
  return (
    <header className="border-b border-linha">
      {/* Faixa de aviso no topo */}
      <p className="bg-ameixa px-4 py-2 text-center text-sm text-blush">
        Aluguel com retirada na Praça Seca (RJ) · Venda com envio para todo o Brasil
      </p>

      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
        <Link href="/" aria-label="Ateline, página inicial">
          <Image src={logo} alt="Ateline" width={80} height={64} priority />
        </Link>

        {/* No celular o menu desce para a linha de baixo; no computador fica ao lado da logo */}
        <nav
          aria-label="Principal"
          className="order-last flex w-full flex-wrap gap-x-6 text-[15px] font-semibold md:order-none md:w-auto md:flex-1"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="py-2 hover:text-framboesa">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex gap-1">
          <Link
            href="/conta"
            aria-label="Minha conta"
            className="grid size-11 place-items-center rounded-full hover:bg-blush"
          >
            <UserRound size={22} strokeWidth={1.8} />
          </Link>
          <BotaoCarrinho />
        </div>
      </div>
    </header>
  );
}