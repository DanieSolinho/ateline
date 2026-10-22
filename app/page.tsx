import Image from "next/image";

const amostras = [
  { nome: "framboesa", classe: "bg-framboesa" },
  { nome: "ameixa", classe: "bg-ameixa" },
  { nome: "blush", classe: "bg-blush" },
  { nome: "rosa", classe: "bg-rosa" },
  { nome: "pêssego", classe: "bg-pessego" },
  { nome: "folha", classe: "bg-folha" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <Image src="/logo-ateline.png" alt="Ateline" width={160} height={128} priority />

      <h1 className="font-display text-4xl font-bold">
        O bolo dos sonhos da sua festa
      </h1>
      <p className="text-lg text-ameixa-suave">
        Teste do tema: se esta frase está em Nunito Sans e o título em Outfit, deu certo.
      </p>

      <div className="flex flex-wrap gap-3">
        {amostras.map((cor) => (
          <div key={cor.nome} className="flex flex-col items-center gap-1 text-sm">
            <span className={`h-14 w-14 rounded-xl border border-linha ${cor.classe}`} />
            {cor.nome}
          </div>
        ))}
      </div>

      <button className="h-12 self-start rounded-xl bg-framboesa px-6 font-bold text-white hover:bg-framboesa-escura">
        Ver bolos disponíveis
      </button>
    </main>
  );
}