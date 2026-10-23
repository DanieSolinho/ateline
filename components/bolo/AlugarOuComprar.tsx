"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { CalendarioReserva } from "@/components/bolo/CalendarioReserva";
import { formatarPreco } from "@/lib/formatar";
import { TAXA_SEGURANCA } from "@/lib/regras";
import type { Bolo } from "@/types/bolo";
import type { Reserva } from "@/types/reserva";

type Modo = "alugar" | "comprar";

type Props = { bolo: Bolo; reservas: Reserva[] };

export function AlugarOuComprar({ bolo, reservas }: Props) {
  const [modo, setModo] = useState<Modo>("alugar");

  const opcoes: { valor: Modo; rotulo: string; preco: number }[] = [
    { valor: "alugar", rotulo: "Alugar", preco: bolo.precoLocacao },
    { valor: "comprar", rotulo: "Comprar", preco: bolo.precoVenda },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Alugar ou comprar" className="grid grid-cols-2 gap-1 rounded-2xl bg-blush p-1">
        {opcoes.map((opcao) => {
          const ativo = modo === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => setModo(opcao.valor)}
              className={`flex flex-col items-center rounded-xl py-3 ${
                ativo ? "bg-white shadow-sm" : "text-ameixa-suave hover:text-ameixa"
              }`}
            >
              <span className="font-bold">{opcao.rotulo}</span>
              <span className="font-display text-xl font-bold">{formatarPreco(opcao.preco)}</span>
            </button>
          );
        })}
      </div>

      {modo === "alugar" ? (
        <>
          <p className="text-ameixa-suave">
            Retirada na loja, na Praça Seca (RJ). Mais {formatarPreco(TAXA_SEGURANCA)} de taxa de
            segurança, devolvida quando a peça volta sem avarias.
          </p>
          <CalendarioReserva bolo={bolo} reservas={reservas} />
        </>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-linha p-5">
          <p className="flex items-center gap-2 font-bold">
            <Truck size={18} /> Envio para todo o Brasil
          </p>
          <p className="text-ameixa-suave">
            O bolo fica com você. O frete é calculado pelo CEP na finalização da compra.
          </p>
          <button
            type="button"
            disabled
            className="h-14 rounded-xl bg-framboesa text-lg font-bold text-white opacity-50"
          >
            Comprar por {formatarPreco(bolo.precoVenda)} (em breve)
          </button>
        </div>
      )}
    </div>
  );
}