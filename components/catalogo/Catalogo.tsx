"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CardBolo } from "@/components/CardBolo";
import { calcularPeriodo, estaDisponivel } from "@/lib/periodo";
import type { Bolo, TipoBolo } from "@/types/bolo";
import type { Reserva } from "@/types/reserva";

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

// "2026-10-24" → "24/10"
function diaMes(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export function Catalogo({ bolos, reservas }: { bolos: Bolo[]; reservas: Reserva[] }) {
  const searchParams = useSearchParams();
  const dataNaUrl = searchParams.get("data");
  // Só aceita datas no formato certo, para ninguém quebrar a página editando o endereço
  const dataFesta = dataNaUrl && /^\d{4}-\d{2}-\d{2}$/.test(dataNaUrl) ? dataNaUrl : null;
  const periodo = dataFesta ? calcularPeriodo(dataFesta) : null;

  const [tipo, setTipo] = useState<FiltroTipo>("todos");
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
    if (tipo !== "todos" && bolo.tipo !== tipo) return false;
    const texto = `${bolo.nome} ${bolo.tema} ${bolo.codigo}`.toLowerCase();
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
            <CardBolo
              key={bolo.codigo}
              bolo={bolo}
              disponivel={disponibilidade?.get(bolo.codigo)}
            />
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