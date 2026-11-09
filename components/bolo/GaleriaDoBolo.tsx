"use client";

import Image from "next/image";
import { useState } from "react";
import type { FotoDoBolo } from "@/lib/fotosDosBolos";

// Foto grande do bolo + miniaturas para trocar. Sem fotos: o quadro "Foto em breve".
export function GaleriaDoBolo({ fotos, nome }: { fotos: FotoDoBolo[]; nome: string }) {
  const [atual, setAtual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-rosa text-ameixa-suave">Foto em breve</div>
    );
  }

  const foto = fotos[Math.min(atual, fotos.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-rosa">
        <Image
          src={foto.grande}
          alt={foto.alt}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {fotos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={`Fotos de ${nome}`}>
          {fotos.map((miniatura, i) => (
            <li key={miniatura.grande} className="shrink-0">
              <button
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
                aria-pressed={i === atual}
                className={`relative block size-16 overflow-hidden rounded-xl border-2 sm:size-20 ${
                  i === atual ? "border-framboesa" : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <Image src={miniatura.pequena} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
