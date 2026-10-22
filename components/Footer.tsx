import Image from "next/image";
import Link from "next/link";

const ajuda = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/contrato", label: "Contrato de locação" },
  { href: "/cancelamento", label: "Política de cancelamento" },
  { href: "/conta", label: "Minha conta" },
];

export function Footer() {
  return (
    <footer className="border-t border-linha bg-blush">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Image src="/logo-ateline.png" alt="Ateline" width={90} height={72} />
          <p className="text-sm text-ameixa-suave">
            Rua Cândido Benício, 2967, bloco P, loja G
            <br />
            Praça Seca, Rio de Janeiro
          </p>
          <a
            href="https://www.instagram.com/atelineatelie"
            className="text-sm font-bold text-framboesa hover:underline"
          >
            @atelineatelie
          </a>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <h2 className="mb-1 font-display text-base font-semibold">Retiradas e devoluções</h2>
          <p>Terça a sexta: retirada a partir das 14h, devolução a partir das 10h</p>
          <p>Sábado: das 10h às 14h</p>
          <p className="text-ameixa-suave">Fechado domingo e segunda</p>
        </div>

        <nav aria-label="Ajuda" className="flex flex-col gap-1 text-sm">
          <h2 className="mb-1 font-display text-base font-semibold">Ajuda</h2>
          {ajuda.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-framboesa">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="border-t border-linha px-4 py-4 text-center text-xs text-ameixa-suave">
        © Ateline Ateliê · Bolos cenográficos
      </p>
    </footer>
  );
}