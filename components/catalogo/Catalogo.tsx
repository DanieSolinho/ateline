"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CardBolo } from "@/components/CardBolo";
import type { Bolo, TipoBolo } from "@/types/bolo";

type FiltroTipo = TipoBolo | "todos";

const opcoesDeTipo: { valor: FiltroTipo; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "bolo", rotulo: "Bolos" },
  { valor: "mini_kit", rotulo: "Mini kits" },
  { valor: "kit_completo", rotulo: "Kits completos" },
];

// "2026-10-25" → "25/10/2026"
function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function Catalogo({ bolos }: { bolos: Bolo[] }) {
  const searchParams = useSearchParams();
  const dataFesta = searchParams.get("data"); // "2026-10-25" ou null

  const [tipo, setTipo] = useState<FiltroTipo>("todos");
  const [busca, setBusca] = useState("");

  // Só refaz o filtro quando a lista, o tipo ou a busca mudam
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return bolos.filter((bolo) => {
      if (tipo !== "todos" && bolo.tipo !== tipo) return false;
      const texto = `${bolo.nome} ${bolo.tema} ${bolo.codigo}`.toLowerCase();
      if (termo && !texto.includes(termo)) return false;
      return true;
    });
  }, [bolos, tipo, busca]);

  return (
    <div className="mt-6 flex flex-col gap-8">
      {dataFesta ? (
        <p className="rounded-xl bg-blush px-4 py-3">
          Festa em <strong>{formatarData(dataFesta)}</strong>.{" "}
          <Link href="/" className="font-bold text-framboesa hover:underline">
            Trocar data
          </Link>
        </p>
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
            placeholder="Tema, nome ou referência"
            className="h-12 rounded-xl border border-ameixa/30 px-3"
          />
        </div>

        <div role="group" aria-label="Tipo" className="flex flex-wrap gap-2">
          {opcoesDeTipo.map((opcao) => {
            const ativo = tipo === opcao.valor;
            return (
              <button
                key={opcao.valor}
                type="button"
                aria-pressed={ativo}
                onClick={() => setTipo(opcao.valor)}
                className={`h-11 rounded-full border px-4 font-semibold ${
                  ativo
                    ? "border-ameixa bg-ameixa text-white"
                    : "border-ameixa/30 bg-white hover:border-ameixa"
                }`}
              >
                {opcao.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-ameixa-suave">
        {filtrados.length} {filtrados.length === 1 ? "resultado" : "resultados"}
      </p>

      {filtrados.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {filtrados.map((bolo) => (
            <CardBolo key={bolo.codigo} bolo={bolo} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-linha p-8 text-center text-ameixa-suave">
          Nenhum bolo encontrado. Tente outra palavra ou outro tipo.
        </p>
      )}
    </div>
  );
}