"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CardBolo } from "@/components/CardBolo";
import { calcularPeriodo, estaDisponivel } from "@/lib/periodo";
import type { BoloVitrine } from "@/types/catalogo";
import type { Reserva } from "@/types/reserva";

// "2026-10-25" → "25/10/2026"
function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// "2026-10-24" → "24/10"
function diaMes(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export function Catalogo({ bolos, reservas }: { bolos: BoloVitrine[]; reservas: Reserva[] }) {
  const searchParams = useSearchParams();
  const dataNaUrl = searchParams.get("data");
  // Só aceita datas no formato certo, para ninguém quebrar a página editando o endereço
  const dataFesta = dataNaUrl && /^\d{4}-\d{2}-\d{2}$/.test(dataNaUrl) ? dataNaUrl : null;
  const periodo = dataFesta ? calcularPeriodo(dataFesta) : null;

  const [busca, setBusca] = useState("");
  const [somenteLivres, setSomenteLivres] = useState(true);

    // Para cada bolo: livre (true) ou reservado (false). Sem data, fica null.
  let disponibilidade: Map<string, boolean> | null = null;
  if (dataFesta) {
    disponibilidade = new Map();
    for (const bolo of bolos) {
      disponibilidade.set(bolo.codigo, estaDisponivel(bolo.codigo, dataFesta, reservas));
    }
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = bolos.filter((bolo) => {
    const texto = `${bolo.nome} ${bolo.tema} ${bolo.codigo} ${bolo.decoracoes.join(" ")}`.toLowerCase();
    if (termo && !texto.includes(termo)) return false;
    if (somenteLivres && disponibilidade && !disponibilidade.get(bolo.codigo)) return false;
    return true;
  });

  return (
    <div className="mt-6 flex flex-col gap-8">
      {dataFesta && periodo ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-blush px-4 py-3">
          <p>
            Festa em <strong>{formatarData(dataFesta)}</strong> · retirada{" "}
            <strong>{diaMes(periodo.retirada)}</strong> · devolução{" "}
            <strong>{diaMes(periodo.devolucao)}</strong>.{" "}
            <Link href="/" className="font-bold text-framboesa hover:underline">
              Trocar data
            </Link>
          </p>
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={somenteLivres}
              onChange={(evento) => setSomenteLivres(evento.target.checked)}
              className="size-5 accent-folha"
            />
            Só livres nessa data
          </label>
        </div>
      ) : (
        <p className="rounded-xl bg-blush px-4 py-3">
          <Link href="/" className="font-bold text-framboesa hover:underline">
            Escolha a data da festa
          </Link>{" "}
          para ver só o que está livre.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-64 flex-1 flex-col gap-1.5">
          <label htmlFor="busca" className="text-sm font-bold">
            Buscar
          </label>
          <input
            id="busca"
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Tema, nome, decoração ou referência"
            className="h-12 rounded-xl border border-ameixa/30 px-3"
          />
        </div>
      </div>

      <p className="text-sm text-ameixa-suave">
        {filtrados.length} {filtrados.length === 1 ? "resultado" : "resultados"}
      </p>

      <h2 className="sr-only">Bolos</h2>
      {filtrados.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((bolo) => (
            <CardBolo
              key={bolo.codigo}
              bolo={bolo}
              disponivel={disponibilidade?.get(bolo.codigo)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-linha p-8 text-center text-ameixa-suave">
          Nenhum bolo encontrado. Tente outra palavra ou outra data.
        </p>
      )}
    </div>
  );
}