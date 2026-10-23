import Link from "next/link";

// Moldura das páginas de ajuda: título, resumo e o texto com espaçamento confortável
export function PaginaDeTexto({ titulo, resumo, children }: {
  titulo: string;
  resumo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Você está em" className="mb-6 text-sm text-ameixa-suave">
        <Link href="/" className="hover:text-framboesa">Início</Link> / {titulo}
      </nav>
      <h1 className="font-display text-4xl font-bold text-balance">{titulo}</h1>
      <p className="mt-3 text-lg text-ameixa-suave">{resumo}</p>
      <div className="mt-10 flex flex-col gap-8 leading-relaxed [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_section]:flex [&_section]:flex-col [&_section]:gap-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
    </main>
  );
}
